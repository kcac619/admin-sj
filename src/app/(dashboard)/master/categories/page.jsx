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
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Image from 'next/image'

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
import { DialogContentText } from '@mui/material'

// Define column helper
const columnHelper = createColumnHelper()

// Alert Component
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const CategoriesPage = () => {
  const theme = useTheme()
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [filteredCategories, setFilteredCategories] = useState([
    { CategoryName: 'Loading...', CategoryID: 'Loading...', ImageKey: 'Loading...' }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['CategoryName', 'asc']])

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastSeverity, setToastSeverity] = useState('success') // 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('')

  // useForm for Add Category
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      CategoryName: '',
      Slug: '',
      Featured: 0,
      Status: 1,
      Position: null, // Handle null or empty string for Position
      Description: '',
      MainID: null, // Handle null or empty string for MainID
      SubID: null, // Handle null or empty string for SubID
      image: null // For file input
    }
  })

  // useForm for Edit Category
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      CategoryID: '',
      CategoryName: '',
      Slug: '',
      Featured: 0, // Set default values for Featured, Status, Position
      Status: 1,
      Position: null,
      Description: '',
      MainID: null,
      SubID: null,
      image: null
    }
  })

  // Handle Add Category Form Submission
  const onAddSubmit = async data => {
    setIsAdding(true)
    try {
      const formData = new FormData()
      formData.append('CategoryName', data.CategoryName)
      formData.append('Slug', data.Slug)
      formData.append('Featured', parseInt(data.Featured, 10)) // Convert to integer
      formData.append('Status', parseInt(data.Status, 10)) // Convert to integer
      formData.append('Position', data.Position ? parseInt(data.Position, 10) : null) // Handle Position as integer or null
      formData.append('Description', data.Description)
      formData.append('MainID', data.MainID ? parseInt(data.MainID, 10) : null) // Handle MainID as integer or null
      formData.append('SubID', data.SubID ? parseInt(data.SubID, 10) : null) // Handle SubID as integer or null

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
          const response = await axios.post('/api/filters/categories', formData)
          console.log('Category added successfully:', response.data)
          handleClose()
          resetAddForm()
          fetchCategories()
          setToastSeverity('success')
          setToastMessage('Category added successfully!')
          setToastOpen(true)
        }
      } else {
        // Handle the case where no image is selected
        alert('Please select an image.')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error creating category. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Category Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const formData = new FormData()
      formData.append('CategoryID', data.CategoryID)
      formData.append('CategoryName', data.CategoryName)
      formData.append('Slug', data.Slug)
      formData.append('Featured', parseInt(data.Featured, 10)) // Convert to integer
      formData.append('Status', parseInt(data.Status, 10)) // Convert to integer
      formData.append('Position', data.Position ? parseInt(data.Position, 10) : null) // Handle Position as integer or null
      formData.append('Description', data.Description)
      formData.append('MainID', data.MainID ? parseInt(data.MainID, 10) : null) // Handle MainID as integer or null
      formData.append('SubID', data.SubID ? parseInt(data.SubID, 10) : null) // Handle SubID as integer or null

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

          // Proceed with the PUT request after file is read
          const response = await axios.put('/api/filters/categories', formData)
          console.log('Category updated successfully:', response.data)
          setEditModalOpen(false)
          resetEditForm()
          fetchCategories()
          setToastSeverity('success')
          setToastMessage('Category updated successfully!')
          setToastOpen(true)
        }
      } else {
        // Proceed with the PUT request if there's no image
        const response = await axios.put('/api/filters/categories', formData)
        console.log('Category updated successfully:', response.data)
        setEditModalOpen(false)
        resetEditForm()
        fetchCategories()
        setToastSeverity('success')
        setToastMessage('Category updated successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error updating category:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error updating category. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (categoryId, newIsActive) => {
    try {
      // API Call to update IsActive
      const response = await axios.put('/api/filters/categories-active', {
        categoryId,
        isActive: newIsActive
      })

      if (response.status === 200) {
        // Update the categories data in the UI
        setCategories(prevCategories =>
          prevCategories.map(category =>
            category.CategoryID === categoryId ? { ...category, IsActive: newIsActive } : category
          )
        )
        setToastSeverity('success')
        setToastMessage('Category active status updated successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error updating IsActive:', error)
      setToastSeverity('error')
      setToastMessage('Error updating category active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Categories Data
  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/categories', {
        headers: {
          Accept: 'application/json'
        }
      })

      console.log('Categories Response Data:', response.data)

      if (response.data.categories) {
        setCategories(response.data.categories)
        setFilteredCategories(response.data.categories)
      } else {
        setError('Categories data not found')
        setToastSeverity('error')
        setToastMessage('Categories data not found.')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Error fetching categories')
      setToastSeverity('error')
      setToastMessage('Error fetching categories. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  useEffect(() => {
    const filteredData = categories.filter(
      category => category.CategoryName.toLowerCase().includes(globalFilter.toLowerCase()) && !category.IsDeleted
    )
    setFilteredCategories(filteredData)
  }, [globalFilter, categories])

  // Handle Edit Category
  const handleEdit = category => {
    setCategoryToEdit(category)

    // Set default values for the edit form
    resetEditForm({
      CategoryID: category.CategoryID,
      CategoryName: category.CategoryName,
      Slug: category.Slug,
      Featured: category.Featured,
      Status: category.Status,
      Position: category.Position,
      Description: category.Description,
      MainID: category.MainID,
      SubID: category.SubID,
      image: null // Reset the image field
    })

    setEditModalOpen(true)
  }

  // Handle Delete Category
  const handleDelete = categoryId => {
    setCategoryToDelete(categoryId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (categoryToDelete) {
        const response = await axios.delete(`/api/filters/categories?categoryId=${categoryToDelete}`)
        console.log(response.data.message)
        fetchCategories()
        setCategoryToDelete(null)
        setToastSeverity('success')
        setToastMessage('Category deleted successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error deleting category. Please try again later.')
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
      columnHelper.accessor('CategoryName', {
        header: 'Category Name',
        cell: info => info.getValue()
      }),

      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.CategoryID, e.target.checked)}
              />
            }
            label='' // Remove the default label text
          />
        )
      }),
      columnHelper.display({
        id: 'image', // New column for displaying the image
        header: 'Image',
        cell: ({ row }) => (
          <div>
            {row.original.featureImageUrl ? (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.featureImageUrl}
                  alt={row.original.CategoryName}
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
            <IconButton onClick={() => handleDelete(row.original.CategoryID)} color='error'>
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
  // const visibleCategories = filteredCategories.filter(Category => !Category.IsDeleted) // Filter out deleted Categories
  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: page,
        pageSize: rowsPerPage
      },
      sorting: {
        // Initial Sorting (Optional)
        //   ['CategoryName', 'asc']
      }
    },
    defaultColumn: {
      // Default sorting for all columns (Optional)
      //   isSortable: true
    }
  })

  // Close Drawer (Add Category)
  const handleClose = () => {
    setAddCategoryOpen(false)
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
          <DialogContentText>Are you sure you want to delete this category?</DialogContentText>
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
      {/* Add Category Drawer */}
      <Drawer
        open={addCategoryOpen}
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
          <Typography variant='h5'>Add New Category</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <Controller
                name='CategoryName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Category Name'
                    placeholder='Enter Category Name'
                    error={!!addErrors.CategoryName}
                    helperText={addErrors.CategoryName ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Slug'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Slug'
                    placeholder='Enter slug'
                    error={!!addErrors.Slug}
                    helperText={addErrors.Slug ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Featured'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Featured'
                    placeholder='Enter Featured'
                    error={!!addErrors.Featured}
                    helperText={addErrors.Featured ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Status'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Status'
                    placeholder='Enter Status'
                    error={!!addErrors.Status}
                    helperText={addErrors.Status ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Position'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Position'
                    placeholder='Enter Position'
                    error={!!addErrors.Position}
                    helperText={addErrors.Position ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Description'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Description'
                    placeholder='Enter Description'
                    error={!!addErrors.Description}
                    helperText={addErrors.Description ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='MainID'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='MainID'
                    placeholder='Enter MainID'
                    error={!!addErrors.MainID}
                    helperText={addErrors.MainID ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='SubID'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='SubID'
                    placeholder='Enter SubID'
                    error={!!addErrors.SubID}
                    helperText={addErrors.SubID ? 'This field is required' : ''}
                  />
                )}
              />
            </div>
            <Controller
              name='image'
              control={control}
              rules={{ required: false }}
              render={({ field }) => {
                // console.log('Image Field Object', field)

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
              <Button variant='contained' type='submit' disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Submit'}
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Edit Category Drawer (Previously a Dialog) */}
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
            Edit Category
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <Controller
                name='CategoryID'
                control={editControl}
                render={({ field }) => <TextField {...field} margin='dense' label='Category ID' fullWidth disabled />}
              />
              <Controller
                name='CategoryName'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Category Name'
                    fullWidth
                    error={!!editErrors.CategoryName}
                    helperText={editErrors.CategoryName ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Slug'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Slug'
                    fullWidth
                    error={!!editErrors.Slug}
                    helperText={editErrors.Slug ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Featured'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Featured'
                    fullWidth
                    error={!!editErrors.Featured}
                    helperText={editErrors.Featured ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Status'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Status'
                    fullWidth
                    error={!!editErrors.Status}
                    helperText={editErrors.Status ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Position'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Position'
                    fullWidth
                    error={!!editErrors.Position}
                    helperText={editErrors.Position ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Description'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='Description'
                    fullWidth
                    error={!!editErrors.Description}
                    helperText={editErrors.Description ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='MainID'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='MainID'
                    fullWidth
                    error={!!editErrors.MainID}
                    helperText={editErrors.MainID ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='SubID'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    label='SubID'
                    fullWidth
                    error={!!editErrors.SubID}
                    helperText={editErrors.SubID ? 'This field is required' : ''}
                  />
                )}
              />
            </div>
            <Controller
              name='image'
              control={editControl}
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
                    {categoryToEdit?.featureImageUrl || (field.value && field.value[0]) ? (
                      <Image
                        src={
                          field.value && field.value[0]
                            ? URL.createObjectURL(field.value[0])
                            : categoryToEdit.featureImageUrl
                        }
                        alt={categoryToEdit?.CategoryName}
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
              <Button type='submit' variant='contained' disabled={isEditing}>
                {isEditing ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </div>
      </Drawer>

      {/* Title and Search Bar */}
      <Typography variant='h4' component='div' gutterBottom>
        Categories Form
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
          {/* <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Categories'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          /> */}
          <Button
            variant='contained'
            onClick={() => setAddCategoryOpen(!addCategoryOpen)}
            className='is-full sm:is-auto'
          >
            Add New Category
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
                        {/* {header.id === 'CategoryName' && // Conditionally render icon
                          (header.column.getIsSorted() === 'asc' ? (
                            <i className='ri-arrow-up-s-line ml-2 pt-5'></i>
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <i className='ri-arrow-down-s-line ml-2 pt-5'></i>
                          ) : (
                            <i className='ri-expand-up-down-line'></i>
                          ))} */}
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
      <Snackbar open={toastOpen} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default CategoriesPage
