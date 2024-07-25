'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

import { useTheme } from '@mui/material/styles'
import axios from 'axios'
// stop ctrl Z
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
import { alpha } from '@mui/material/styles'
import { Button, Divider, Drawer, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'

import primaryColorConfig from '../../../../configs/primaryColorConfig' // Adjust the import path as needed
import { rankItem } from '@tanstack/match-sorter-utils'

// Define column helper
const columnHelper = createColumnHelper()

const ShapesPage = () => {
  const theme = useTheme()
  const [shapes, setShapes] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [filteredShapes, setFilteredShapes] = useState([
    { ShapeID: 'Loading...', ShapeName: 'Loading...', ImageUrl: 'Loading...' }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [addShapeOpen, setAddShapeOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [shapeToEdit, setShapeToEdit] = useState(null)
  const searchInputRef = useRef(null)

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

      setEditModalOpen(false)
      resetEditForm()
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
      const response = await axios.post('/api/filters/shapes', data)

      console.log('form submission response.data:', response.data)
      handleClose()
      resetForm()
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

      console.log('Shapes Response Data:', response.data)

      if (response.data.shapes) {
        setShapes(response.data.shapes)
        setFilteredShapes(response.data.shapes)
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

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  useEffect(() => {
    const filteredData = shapes.filter(shape => shape.ShapeName.toLowerCase().includes(globalFilter.toLowerCase()))
    setFilteredShapes(filteredData)
  }, [globalFilter, shapes])

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
      fetchShapes()
    } catch (error) {
      console.error('Error deleting shape:', error)
      setError(error.message)
    }
  }

  const columns = useMemo(
    () => [
      // columnHelper.display({
      //   id: 'select',
      //   header: ({ table }) => (
      //     <Checkbox
      //       {...{
      //         checked: table.getIsAllRowsSelected(),
      //         indeterminate: table.getIsSomeRowsSelected(),
      //         onChange: table.getToggleAllRowsSelectedHandler()
      //       }}
      //     />
      //   ),
      //   cell: ({ row }) => (
      //     <Checkbox
      //       {...{
      //         checked: row.getIsSelected(),
      //         disabled: !row.getCanSelect(),
      //         indeterminate: row.getIsSomeSelected(),
      //         onChange: row.getToggleSelectedHandler()
      //       }}
      //     />
      //   )
      // }),
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
          <div className='flex space-x-2'>
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

  const DebouncedInput = ({ value: initialValue, inputRef, onChange, debounce = 500, ...props }) => {
    const [value, setValue] = useState(initialValue)
    const [shouldFocus, setShouldFocus] = useState(false)

    useEffect(() => {
      setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
      const timeout = setTimeout(() => {
        onChange(value)
        setShouldFocus(true)
      }, debounce)

      return () => clearTimeout(timeout)
    }, [value, onChange, debounce])

    useEffect(() => {
      if (shouldFocus && inputRef.current) {
        inputRef.current.focus()
        setShouldFocus(false)
      }
    }, [shouldFocus, inputRef])

    return (
      <TextField
        {...props}
        value={value}
        onChange={e => setValue(e.target.value)}
        inputRef={inputRef}
        size='small'
        sx={{
          '& .MuiInputBase-input::placeholder': {
            color: 'gray'
          },
          borderColor: 'gray'
        }}
      />
    )
  }

  const table = useReactTable({
    data: filteredShapes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: page,
        pageSize: rowsPerPage
      }
    }
  })

  const handleClose = () => {
    setAddShapeOpen(false)
  }

  const exportData = () => {
    // Implement the export functionality here
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
                  disabled
                  {...(editErrors.ShapeID && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
            <Controller
              name='ShapeName'
              control={editControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Shape Name'
                  fullWidth
                  {...(editErrors.ShapeName && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
            <Controller
              name='ImageUrl'
              control={editControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='ImageUrl'
                  fullWidth
                  {...(editErrors.ImageUrl && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditModalOpen(false)
              resetEditForm()
            }}
            color='secondary'
          >
            Cancel
          </Button>
          <Button onClick={handleEditSubmit(onEditSubmit)} color='primary'>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <div className='sm:mx-0 sm:px-0 md:m-4'>
        <div className=' pt-0 flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
          {/* <Button
            color='secondary'
            variant='outlined'
            sx={{ borderColor: 'gray', color: 'gray' }}
            startIcon={<i className='ri-upload-2-line' />}
            className='is-full sm:is-auto'
          >
            Export
          </Button> */}
          <h1 className='text-2xl'>Shapes</h1>
          <div className='flex items-center gap-x-4 max-sm:gap-y-4 is-full flex-col sm:is-auto sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => {
                setGlobalFilter(String(value))
              }}
              placeholder='Search Shapes'
              inputRef={searchInputRef}
              className='is-full sm:is-auto'
            />
            <Button variant='contained' onClick={() => setAddShapeOpen(!addShapeOpen)} className='is-full sm:is-auto'>
              Add New Shape
            </Button>
          </div>
        </div>
        <div className='mt-4'>
          <Card sx={{ width: '100%', overflow: 'auto' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow
                      key={headerGroup.id}
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.primary.main, 0.7)
                            : alpha(theme.palette.primary.light, 0.7),
                        padding: '0px'
                      }}
                    >
                      {headerGroup.headers.map(header => (
                        <TableCell key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder ? null : <div>{header.column.columnDef.header}</div>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      sx={{
                        backgroundColor: row.original.IsDeleted ? alpha(theme.palette.error.main, 0.3) : 'inherit',
                        padding: '0px'
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          sx={{
                            paddingY: '2px'
                          }}
                        >
                          {cell.column.columnDef.cell(cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component='div'
              count={filteredShapes.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={event => setRowsPerPage(parseInt(event.target.value, 10))}
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.7)
                    : alpha(theme.palette.primary.light, 0.7)
              }}
            />
          </Card>
        </div>
      </div>
    </>
  )
}

export default ShapesPage
