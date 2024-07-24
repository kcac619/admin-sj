'use client'
import { useTheme } from '@mui/material/styles'
import primaryColorConfig from '../../../../configs/primaryColorConfig' // Adjust the import path as needed

import { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'

// MUI Imports
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

// React Table Imports
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Button, Divider, Drawer, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'

// Define column helper
const columnHelper = createColumnHelper()

const ShapesPage = () => {
  const theme = useTheme()
  const [shapes, setShapes] = useState([{ ShapeID: 'Loading...', ShapeName: 'Loading...', ImageUrl: 'Loading...' }])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')
  //   const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [addShapeOpen, setAddShapeOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [shapeToEdit, setShapeToEdit] = useState(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      ShapeID: '',
      ShapeName: '',
      ImageUrl: ''
    }
  })

  const onEditSubmit = async data => {
    try {
      const response = await axios.put('/api/filters/shapes', data)
      console.log(response.data.message)

      // Close the modal
      setEditModalOpen(false)

      // Reset the form
      resetEditForm()

      // Refetch shapes to update the table
      fetchShapes()
    } catch (error) {
      console.error('Error updating shape:', error)
      setError(error.message)
    }
  }

  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      ShapeName: '',
      ImageUrl: 'default.jpg'
    }
  })

  const onSubmit = async data => {
    try {
      console.log('form data before submission:', data)
      const response = await axios.post('/api/filters/shapes', data)
      console.log('form submission response.data:', response.data) // Log success message

      // Close the drawer
      handleClose()

      // Reset the form
      resetForm()

      // Refetch shapes to update the table (optional but recommended)
      fetchShapes()
    } catch (error) {
      console.error('Error creating shape:', error)
      setError(error.message)
    }
  }

  const fetchShapes = async () => {
    try {
      const response = await axios.get('/api/filters/shapes', {
        headers: {
          Accept: 'application/json'
        }
      })
      console.log('Response Data:', response.data) // Log the full response data
      if (response.data.shapes) {
        setShapes(response.data.shapes)
      } else {
        setError('Shapes data not found')
      }
    } catch (error) {
      console.error('Error fetching shapes:', error)
      setError('Error fetching shapes')
    }
  }
  useEffect(() => {
    fetchShapes()
  }, [])

  const handleEdit = shape => {
    setShapeToEdit(shape)

    resetEditForm({
      ShapeID: shape.ShapeID,
      ShapeName: shape.ShapeName,
      ImageUrl: shape.ImageUrl
    })

    setEditModalOpen(true)
  }

  const handleDelete = async shapeId => {
    try {
      const response = await axios.delete(`/api/filters/shapes?shapeId=${shapeId}`)
      console.log(response.data.message)

      // Update shapes state - you can either refetch all shapes
      // or remove the deleted shape from the existing shapes array
      fetchShapes()
    } catch (error) {
      console.error('Error deleting shape:', error)
      setError(error.message)
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      }),
      columnHelper.accessor('ShapeID', {
        header: 'Shape ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('ShapeName', {
        header: 'Shape Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('ImageUrl', {
        header: 'URL',
        cell: info => info.getValue()
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div>
            <IconButton onClick={() => handleEdit(row.original)} color='primary'>
              <i className='ri-edit-box-line' />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original.ShapeID)} color='secondary'>
              <i className='ri-delete-bin-7-line' />
            </IconButton>
          </div>
        )
      })
    ],
    []
  )

  const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
    // States
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
      setValue(initialValue)
    }, [initialValue])
    useEffect(() => {
      const timeout = setTimeout(() => {
        onChange(value)
      }, debounce)

      return () => clearTimeout(timeout)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
      <TextField
        {...props}
        value={value}
        onChange={e => setValue(e.target.value)}
        size='small'
        sx={{
          '& .MuiInputBase-input::placeholder': {
            color: 'gray' // Change this to your desired color
          },
          borderColor: 'gray'
        }}
      />
    )
  }

  const table = useReactTable(
    {
      data: shapes,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      state: {
        pagination: {
          pageIndex: page,
          pageSize: rowsPerPage
        },
        globalFilter: globalFilter
      },
      onGlobalFilterChange: setGlobalFilter,
      globalFilterFn: (row, columnId, value) => {
        const searchValue = value.toLowerCase()
        return row.getValue('ShapeName').toLowerCase().includes(searchValue)
      }
    },
    [globalFilter]
  )
  const handleClose = () => {
    setAddShapeOpen(false)
  }

  return (
    <>
      <Drawer open={addShapeOpen} anchor='right' variant='temporary' onClose={handleClose} sx={{ width: '400px' }}>
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Add New Shape</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='ShapeName'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='ShapeName'
                  placeholder='Round'
                  {...(errors.ShapeName && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
            <Controller
              name='ImageUrl'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='ImageURL'
                  placeholder='Round'
                  {...(errors.ImageUrl && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit'>
                Submit
              </Button>
              <Button
                variant='outlined'
                color='error'
                type='reset'
                onClick={() => {
                  handleClose()
                  resetForm()
                }}
              >
                {/* // change this ro handle reset later */}
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Shape</DialogTitle>
        <DialogContent>
          <form onSubmit={handleEditSubmit(onEditSubmit)}>
            <Controller
              name='ShapeID'
              control={editControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Shape ID'
                  fullWidth
                  disabled // Shape ID should not be editable
                  //   value={shapeToEdit ? shapeToEdit.ShapeID : ''}
                />
              )}
            />
            <Controller
              name='ShapeName'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Shape Name'
                  fullWidth
                  error={!!editErrors.ShapeName}
                  helperText={editErrors.ShapeName ? 'This field is required' : ''}
                  //   value={shapeToEdit ? shapeToEdit.ShapeName : ''}
                />
              )}
            />
            <Controller
              name='ImageUrl'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => {
                console.log('Field object for ImageUrl:', field) // Add this line
                return (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Image URL'
                    fullWidth
                    error={!!editErrors.ImageUrl}
                    helperText={editErrors.ImageUrl ? 'This field is required' : ''}
                    // value={shapeToEdit ? shapeToEdit.ImageUrl : ''}
                  />
                )
              }}
            />
            {/* Add more fields for IsActive, etc. if needed */}

            <DialogActions>
              <Button onClick={() => setEditModalOpen(false)} color='error'>
                Cancel
              </Button>
              <Button type='submit' variant='contained'>
                Submit
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      <Typography variant='h4' component='div' gutterBottom>
        Shapes Form
      </Typography>

      <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
        <Button
          color='secondary'
          variant='outlined'
          sx={{ borderColor: 'gray', color: 'gray' }}
          startIcon={<i className='ri-upload-2-line' />}
          className='is-full sm:is-auto'
        >
          Export
        </Button>
        <div className='flex items-center gap-x-4 max-sm:gap-y-4 is-full flex-col sm:is-auto sm:flex-row'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Shapes'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          />
          <Button variant='contained' onClick={() => setAddShapeOpen(!addShapeOpen)} className='is-full sm:is-auto'>
            Add New Shape
          </Button>
        </div>
      </div>
      <Card
        style={{
          borderRadius: '10px',
          boxShadow: '4px 4px 4px 4px rgba(0,0,0,0.2) ',
          backgroundColor: '#282a42'
          //   overflowX: 'scroll'
        }}
      >
        {error && <Typography color='error'>{error}</Typography>}
        <TableContainer>
          <Table>
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableCell
                      key={header.id}
                      style={{
                        backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : primaryColor.light,
                        color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444'
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  style={{ padding: 0, margin: 0 }}
                  className={row.original.IsDeleted ? 'deleted-row' : ''}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      style={{
                        paddingTop: '1px',
                        paddingBottom: '1px',
                        backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                        color: theme.palette.mode === 'dark' ? '#eee9ef' : '#555'
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          style={{
            backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : primaryColor.light,
            color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444'
          }}
          onRowsPerPageChange={event => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
        />
      </Card>
    </>
  )
}

export default ShapesPage
