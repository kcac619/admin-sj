'use client'
import { useTheme } from '@mui/material/styles'
import primaryColorConfig from '../../../../configs/primaryColorConfig'
import React, { useEffect, useState, useMemo, useRef } from 'react'
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
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'

// React Table Imports
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Controller, useForm } from 'react-hook-form'

// For Image Display
import Image from 'next/image'
import { DialogContentText, FormControlLabel, Input, Switch } from '@mui/material'
import { TextFields } from '@mui/icons-material'

// Define column helper
const columnHelper = createColumnHelper()

// Alert Component
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

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

  const [sorting, setSorting] = useState([['ShapeName', 'asc']])

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastSeverity, setToastSeverity] = useState('success') // 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('')

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
    setIsAdding(true)
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
          setToastSeverity('success')
          setToastMessage('Shape added successfully!')
          setToastOpen(true)
        }
      } else {
        // Handle the case where no image is selected
        alert('Please select an image.')
      }
    } catch (error) {
      console.error('Error creating shape:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error creating shape. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Shape Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
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
          setToastSeverity('success')
          setToastMessage('Shape updated successfully!')
          setToastOpen(true)
        }
      } else {
        // Proceed with the request if there's no image
        const response = await axios.put('/api/filters/shapes', formData)
        console.log('Shape updated successfully:', response.data)
        setEditModalOpen(false)
        resetEditForm()
        fetchShapes()
        setToastSeverity('success')
        setToastMessage('Shape updated successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error updating shape:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error updating shape. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (shapeId, newIsActive) => {
    try {
      // API Call to update IsActive
      const response = await axios.put('/api/filters/shapes-active', {
        shapeId,
        isActive: newIsActive
      })

      if (response.status === 200) {
        // Update the shapes data in the UI
        setShapes(prevShapes =>
          prevShapes.map(shape => (shape.ShapeID === shapeId ? { ...shape, IsActive: newIsActive } : shape))
        )
        setToastSeverity('success')
        setToastMessage('Shape active status updated successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error updating IsActive:', error)
      setToastSeverity('error')
      setToastMessage('Error updating shape active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Shapes Data
  const fetchShapes = async () => {
    setIsLoading(true)
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
        setToastSeverity('error')
        setToastMessage('Shapes data not found.')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error fetching shapes:', error)
      setError('Error fetching shapes')
      setToastSeverity('error')
      setToastMessage('Error fetching shapes. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
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
    setIsDeleting(true)
    try {
      if (shapeToDelete) {
        const response = await axios.delete(`/api/filters/shapes?shapeId=${shapeToDelete}`)
        console.log(response.data.message)
        fetchShapes()
        setShapeToDelete(null)
        setToastSeverity('success')
        setToastMessage('Shape deleted successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error deleting shape:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error deleting shape. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmationOpen(false)
    }
  }

  // Define Table Columns
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'srNo',
        header: 'Sr. No.',
        cell: ({ row }) => row.index + 1 // Simple SR No.
      }),
      columnHelper.accessor('ShapeName', {
        header: 'Shape Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.ShapeID, e.target.checked)}
              />
            }
            label='' // Remove the default label text
          />
        )
      }),
      columnHelper.display({
        id: 'image',
        header: 'Image',
        cell: ({ row }) => (
          <div>
            {row.original.imageUrl ? (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.imageUrl}
                  alt={row.original.ShapeName}
                  width={30}
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
          <div className='flex space-x-2 justify-center'>
            <IconButton onClick={() => handleEdit(row.original)} color='primary'>
              <i className='ri-edit-box-line' />
            </IconButton>
            {isDeleting && shapeToDelete === row.original.ShapeID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.ShapeID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [isDeleting, shapeToDelete] // Add isDeleting and shapeToDelete to dependencies
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
  const table = useReactTable({
    data: filteredShapes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      pagination: {
        pageIndex: page,
        pageSize: rowsPerPage
      },
      sorting
    }
  })
  // Close Drawer (Add Shape)
  const handleClose = () => {
    setAddShapeOpen(false)
  }

  const exportData = () => {
    // Implement the export functionality here
  }

  // Handle Toast Close
  const handleToastClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setToastOpen(false)
  }

  return (
    <div className='mt-0 pt-0'>
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
          {isDeleting ? (
            <CircularProgress size={20} />
          ) : (
            <Button onClick={handleConfirmDelete} color='error'>
              Yes, Delete
            </Button>
          )}
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
                  {/* Image Preview Area */}
                  <div className='mt-4 flex items-center justify-center'>
                    {field.value && field.value[0] ? (
                      <Image
                        src={URL.createObjectURL(field.value[0])}
                        alt='Selected Image'
                        width={150}
                        height={150}
                        className='rounded-md shadow-md'
                      />
                    ) : (
                      <Typography variant='body2' color='textSecondary'>
                        No Image Selected
                      </Typography>
                    )}
                  </div>
                  {field.value && field.value[0] && (
                    <Typography variant='body2'>Selected file: {field.value[0].name}</Typography>
                  )}
                  {isAdding && <CircularProgress size={24} className='ms-3' />}
                </Stack>
              )}
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
                  {/* Image Preview Area */}
                  <div className='mt-4 flex items-center justify-center'>
                    {shapeToEdit?.imageUrl || (field.value && field.value[0]) ? (
                      <Image
                        src={field.value && field.value[0] ? URL.createObjectURL(field.value[0]) : shapeToEdit.imageUrl}
                        alt={shapeToEdit?.ShapeName}
                        width={150}
                        height={150}
                        className='rounded-md shadow-md'
                      />
                    ) : (
                      <Typography variant='body2' color='textSecondary'>
                        No Image Selected
                      </Typography>
                    )}
                  </div>
                  {field.value && field.value[0] && (
                    <Typography variant='body2'>Selected file: {field.value[0].name}</Typography>
                  )}
                  {isEditing && <CircularProgress size={24} className='ms-3' />}
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
        {isLoading && (
          <div className='flex justify-center items-center h-full'>
            <CircularProgress />
          </div>
        )}
        {!isLoading && (
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
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          height: '50px',
                          textAlign: 'center'
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}

                        {/* Render Remix Icons for Sorting ONLY for ShapeName column */}
                        {header.id === 'ShapeName' && // Conditionally render icon
                          (header.column.getIsSorted() === 'asc' ? (
                            <i className='ri-arrow-up-s-line ml-2 pt-5'></i>
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <i className='ri-arrow-down-s-line ml-2 pt-5'></i>
                          ) : (
                            <i className='ri-expand-up-down-line'></i>
                          ))}
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
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#555',
                          alignContent: 'center',
                          textAlign: 'center',
                          alignItems: 'center'
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
        )}

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
      {/* Toast */}
      <Snackbar open={toastOpen} autoHideDuration={6000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default ShapesPage
