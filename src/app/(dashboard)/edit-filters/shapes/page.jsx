'use client'
import { useTheme } from '@mui/material/styles'
import primaryColorConfig from '../../../../configs/primaryColorConfig'
import { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'

// MUI Imports
import Card from '@mui/material/Card'
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
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
// React Table Imports
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Controller, useForm } from 'react-hook-form'

// For Image Display
import Image from 'next/image'
import { DialogContentText, Input } from '@mui/material'
import { TextFields } from '@mui/icons-material'

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
    { ShapeName: 'Loading...', ShapeID: 'Loading...', ImageKey: 'Loading...' }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [addShapeOpen, setAddShapeOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [shapeToEdit, setShapeToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [shapeToDelete, setShapeToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  // useForm for Add Shape
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      ShapeName: '',
      image: null // For file input
    }
  })

  // useForm for Edit Shape
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      ShapeID: '',
      ShapeName: '',
      image: null // For file input
    }
  })

  // Handle Add Shape Form Submission
  const onAddSubmit = async data => {
    try {
      const formData = new FormData()
      formData.append('ShapeName', data.ShapeName)

      if (data.image && data.image[0]) {
        const file = data.image[0]
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          alert('Only JPG, PNG, and GIF files are allowed.')
          return
        }
        if (file.size > 1 * 1024 * 1024) {
          // 1MB
          alert('File size should not exceed 1MB.')
          return
        }

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = async () => {
          const base64data = reader.result
          const imageData = {
            fileName: `${Date.now()}${file.name}`,
            mimeType: file.type,
            base64: base64data
          }
          formData.append('imageData', JSON.stringify(imageData))

          // Proceed with the POST request after file is read
          const response = await axios.post('/api/filters/shapes', formData)
          console.log('Shape added successfully:', response.data)
          handleClose()
          resetAddForm()
          fetchShapes()
        }
      } else {
        // Handle the case where no image is selected
        alert('Please select an image.')
      }
    } catch (error) {
      console.error('Error creating shape:', error)
      setError(error.message)
    }
  }

  // Handle Edit Shape Form Submission
  const onEditSubmit = async data => {
    try {
      const formData = new FormData()
      formData.append('ShapeID', data.ShapeID)
      formData.append('ShapeName', data.ShapeName)

      if (data.image && data.image[0]) {
        const file = data.image[0]
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          alert('Only JPG, PNG, and GIF files are allowed.')
          return
        }
        if (file.size > 1 * 1024 * 1024) {
          // 1MB
          alert('File size should not exceed 1MB.')
          return
        }

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = async () => {
          const base64data = reader.result
          const imageData = {
            fileName: `${Date.now()}${file.name}`,
            mimeType: file.type,
            base64: base64data
          }
          formData.append('imageData', JSON.stringify(imageData))

          // Proceed with the request after the file is read
          const response = await axios.put('/api/filters/shapes', formData)
          console.log('Shape updated successfully:', response.data)
          setEditModalOpen(false)
          resetEditForm()
          fetchShapes()
        }
      } else {
        // Proceed with the request if there's no image
        const response = await axios.put('/api/filters/shapes', formData)
        console.log('Shape updated successfully:', response.data)
        setEditModalOpen(false)
        resetEditForm()
        fetchShapes()
      }
    } catch (error) {
      console.error('Error updating shape:', error)
      setError(error.message)
    }
  }

  // Fetch Shapes Data
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
    const filteredData = shapes.filter(
      shape => shape.ShapeName.toLowerCase().includes(globalFilter.toLowerCase()) && !shape.IsDeleted
    )
    setFilteredShapes(filteredData)
  }, [globalFilter, shapes])

  // Handle Edit Shape
  const handleEdit = shape => {
    setShapeToEdit(shape)

    // Set default values for the edit form
    resetEditForm({
      ShapeID: shape.ShapeID,
      ShapeName: shape.ShapeName
      // image: null // Reset the image field
    })

    setEditModalOpen(true)
  }

  // Handle Delete Shape
  const handleDelete = shapeId => {
    setShapeToDelete(shapeId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      if (shapeToDelete) {
        const response = await axios.delete(`/api/filters/shapes?shapeId=${shapeToDelete}`)
        console.log(response.data.message)
        fetchShapes()
        setShapeToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting shape:', error)
      setError(error.message)
    } finally {
      setDeleteConfirmationOpen(false)
    }
  }

  // Define Table Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('ShapeID', {
        header: 'Shape ID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('ShapeName', {
        header: 'Shape Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('ImageKey', {
        // Changed ImageUrl to imageKey
        header: 'Image Key',
        cell: info => info.getValue()
      }),
      columnHelper.display({
        id: 'image', // New column for displaying the image
        header: 'Image',
        cell: ({ row }) => (
          <div>
            {row.original.imageUrl ? (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.imageUrl}
                  alt={row.original.ShapeName}
                  width={30} // Adjust width as needed
                  height={30}
                  className='block max-w-full h-auto'
                />
              </div>
            ) : (
              <Typography variant='body2'>No Image</Typography>
            )}
          </div>
        )
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

  // Debounced Input for Search
  const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, inputRef, ...props }) => {
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
        size='small'
        inputRef={inputRef}
        sx={{
          '& .MuiInputBase-input::placeholder': {
            color: 'gray'
          },
          borderColor: 'gray'
        }}
      />
    )
  }

  // React Table Instance
  // const visibleShapes = filteredShapes.filter(shape => !shape.IsDeleted) // Filter out deleted shapes
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

  // Close Drawer (Add Shape)
  const handleClose = () => {
    setAddShapeOpen(false)
  }

  const exportData = () => {
    // Implement the export functionality here
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmationOpen} onClose={() => setDeleteConfirmationOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this shape?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)} color='primary'>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color='error'>
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Shape Drawer */}
      <Drawer
        open={addShapeOpen}
        anchor='right'
        variant='temporary'
        onClose={handleClose}
        sx={{ width: '400px' }}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              lg: '50%'
            }
          }
        }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Add New Shape</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='ShapeName'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Shape Name'
                  placeholder='Enter shape name'
                  error={!!addErrors.ShapeName}
                  helperText={addErrors.ShapeName ? 'This field is required' : ''}
                />
              )}
            />

            <Controller
              name='image'
              control={control}
              rules={{ required: false }}
              render={({ field }) => {
                console.log('Image Field Object', field)

                return (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload New Image (Optional)
                      <input
                        type='file'
                        hidden
                        accept='.jpg,.jpeg,.png,.gif'
                        {...field}
                        onChange={e => {
                          const file = e.target.files[0]
                          if (file) {
                            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                              alert('Only JPG, PNG, and GIF files are allowed.')
                              return
                            }
                            if (file.size > 1 * 1024 * 1024) {
                              // 1MB
                              alert('File size should not exceed 1MB.')
                              return
                            }
                          }
                          field.onChange(e.target.files)
                        }}
                        value={undefined}
                      />
                    </Button>
                    {field.value && field.value[0] && (
                      <Typography variant='body2'>Selected file: {field.value[0].name}</Typography>
                    )}
                  </Stack>
                )
              }}
            />

            <div className='flex items-end gap-4'>
              <Button
                variant='outlined'
                color='error'
                onClick={() => {
                  handleClose()
                  resetAddForm()
                }}
              >
                Cancel
              </Button>
              <Button variant='contained' type='submit'>
                Submit
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Edit Shape Drawer (Previously a Dialog) */}
      <Drawer
        open={editModalOpen}
        anchor='right'
        variant='temporary'
        onClose={() => {
          setEditModalOpen(false)
          resetEditForm()
        }}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              lg: '50%'
            }
          }
        }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography align='center' variant='h3'>
            Edit Shape
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='ShapeID'
              control={editControl}
              render={({ field }) => <TextField {...field} margin='dense' label='Shape ID' fullWidth disabled />}
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
                />
              )}
            />

            {/* Image Upload in Edit Shape Drawer */}
            <Controller
              name='image'
              control={editControl}
              render={({ field }) => (
                <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                  <Button variant='contained' component='label'>
                    Upload New Image (Optional)
                    <input
                      type='file'
                      hidden
                      accept='.jpg,.jpeg,.png,.gif'
                      {...field}
                      onChange={e => {
                        const file = e.target.files[0]
                        if (file) {
                          if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                            alert('Only JPG, PNG, and GIF files are allowed.')
                            return
                          }
                          if (file.size > 1 * 1024 * 1024) {
                            // 1MB
                            alert('File size should not exceed 1MB.')
                            return
                          }
                        }
                        field.onChange(e.target.files)
                      }}
                      value={undefined}
                    />
                  </Button>
                  {field.value && field.value[0] && (
                    <Typography variant='body2'>Selected file: {field.value[0].name}</Typography>
                  )}
                </Stack>
              )}
            />

            <DialogActions sx={{ mt: 3 }}>
              <Button onClick={() => setEditModalOpen(false)} color='error'>
                Cancel
              </Button>
              <Button type='submit' variant='contained'>
                Save
              </Button>
            </DialogActions>
          </form>
        </div>
      </Drawer>

      {/* Title and Search Bar */}
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
          onClick={exportData} // Add onClick handler for export
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

      {/* Table */}
      <Card
        style={{
          borderRadius: '10px',
          boxShadow: '4px 4px 4px 4px rgba(0,0,0,0.2) ',
          backgroundColor: '#282a42'
        }}
      >
        {error && <Typography color='error'>{error}</Typography>}
        <TableContainer>
          <Table>
            {/* Table Head */}
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

            {/* Table Body */}
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

        {/* Table Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          count={table.getFilteredRowModel().rows.length} // Use filtered count
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
