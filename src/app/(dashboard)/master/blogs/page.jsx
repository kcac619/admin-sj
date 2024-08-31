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
import DatePicker from '@mui/lab/DatePicker'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'

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

const BlogFilterPage = () => {
  const theme = useTheme()
  const [blogs, setBlogs] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [filteredBlogs, setFilteredBlogs] = useState([
    { Title: 'Loading...', BlogID: 'Loading...', Description: 'Loading...', ImageUrl: 'Loading...' }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [addBlogOpen, setAddBlogOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [blogToEdit, setBlogToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [blogToDelete, setBlogToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['BlogID', 'asc']]) // Default sorting

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastSeverity, setToastSeverity] = useState('success') // 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('')

  // useForm for Add Blog
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      Title: '',
      Description: '',
      ImageUrl: '',
      Link: '',
      Date: null // Initialize Date as null
    }
  })

  // useForm for Edit Blog
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      BlogID: '',
      Title: '',
      Description: '',
      ImageUrl: '',
      Link: '',
      Date: null
    }
  })

  // Handle Add Blog Form Submission
  const onAddSubmit = async data => {
    setIsAdding(true)
    try {
      // Format the date to YYYY-MM-DD
      const formattedDate = data.Date ? data.Date.toISOString().slice(0, 10) : null

      const response = await axios.post('/api/filters/blogs', {
        Title: data.Title,
        Description: data.Description,
        ImageUrl: data.ImageUrl,
        Link: data.Link,
        Date: formattedDate, // Send the formatted date
        CreatedBy: 1, // Replace with the actual user ID
        CompanyID: 1 // Replace with the actual company ID
      })

      if (response.data.statusid === 1) {
        fetchBlogs() // Update the UI after successful addition
        handleClose()
        resetAddForm()
        setToastSeverity('success')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      } else {
        setError(response.data.statusmessage)
        setToastSeverity('error')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error creating blog:', error)
      setError('Error creating blog')
      setToastSeverity('error')
      setToastMessage('Error creating blog. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Blog Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const formattedDate = data.Date ? data.Date.toISOString().slice(0, 10) : null
      const response = await axios.put('/api/filters/blogs', {
        BlogID: parseInt(data.BlogID),
        Title: data.Title,
        Description: data.Description,
        ImageUrl: data.ImageUrl,
        Link: data.Link,
        Date: formattedDate, // Send the formatted date
        ModifiedBy: 1 // Replace with the actual user ID
      })

      if (response.data.statusid === 1) {
        fetchBlogs() // Update the UI after successful editing
        setEditModalOpen(false)
        resetEditForm()
        setToastSeverity('success')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      } else {
        setError(response.data.statusmessage)
        setToastSeverity('error')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error updating blog:', error)
      setError('Error updating blog')
      setToastSeverity('error')
      setToastMessage('Error updating blog. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (blogId, newIsActive) => {
    try {
      const response = await axios.put('/api/filters/blogs-active', {
        blogId,
        isActive: newIsActive
      })

      if (response.data.statusid === 1) {
        // Update the blogs data in the UI
        setBlogs(prevBlogs =>
          prevBlogs.map(blog => (blog.BlogID === blogId ? { ...blog, IsActive: newIsActive } : blog))
        )
        setToastSeverity('success')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      } else {
        setError(response.data.statusmessage)
        setToastSeverity('error')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error updating IsActive:', error)
      setToastSeverity('error')
      setToastMessage('Error updating blog active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Blogs Data
  const fetchBlogs = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/blogs', {
        headers: {
          Accept: 'application/json'
        }
      })

      console.log('Blogs Response Data:', response.data)

      if (response.data.blogs) {
        setBlogs(response.data.blogs)
        setFilteredBlogs(response.data.blogs)
      } else {
        setError('Blogs data not found')
        setToastSeverity('error')
        setToastMessage('Blogs data not found.')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
      setError('Error fetching blogs')
      setToastSeverity('error')
      setToastMessage('Error fetching blogs. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  useEffect(() => {
    const filteredData = blogs.filter(
      blog => blog.Title.toLowerCase().includes(globalFilter.toLowerCase()) && !blog.IsDeleted
    )
    setFilteredBlogs(filteredData)
  }, [globalFilter, blogs])

  // Handle Edit Blog
  const handleEdit = blog => {
    setBlogToEdit(blog)

    // Set default values for the edit form
    resetEditForm({
      BlogID: blog.BlogID,
      Title: blog.Title,
      Description: blog.Description,
      ImageUrl: blog.ImageUrl,
      Link: blog.Link,
      Date: blog.Date ? new Date(blog.Date) : null // Parse Date string to Date object
    })

    setEditModalOpen(true)
  }

  // Handle Delete Blog
  const handleDelete = blogId => {
    setBlogToDelete(blogId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (blogToDelete) {
        const response = await axios.delete(`/api/filters/blogs?blogId=${blogToDelete}`)
        console.log(response.data.message)
        fetchBlogs()
        setBlogToDelete(null)
        setToastSeverity('success')
        setToastMessage('Blog deleted successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error deleting blog. Please try again later.')
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
      columnHelper.accessor('Title', {
        header: 'Title',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Description', {
        header: 'Description',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('ImageUrl', {
        header: 'ImageUrl',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Link', {
        header: 'Link',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Date', {
        header: 'Date',
        cell: info => info.getValue() // Display the date
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.BlogID, e.target.checked)}
              />
            }
            label='' // Remove the default label text
          />
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
            {isDeleting && blogToDelete === row.original.BlogID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.BlogID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [isDeleting, blogToDelete] // Add isDeleting and shapeToDelete to dependencies
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
    data: blogs,
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
    setAddBlogOpen(false)
    resetAddForm() // Reset Add form when closing the drawer
    setEditModalOpen(false)
    resetEditForm() // Reset Edit form when closing the drawer
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
          <DialogContentText>Are you sure you want to delete this blog?</DialogContentText>
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
      {/* Add Blog Drawer */}
      <Drawer
        open={addBlogOpen}
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
          <Typography variant='h5'>Add New Blog</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='Title'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Title'
                  placeholder='Enter Title'
                  error={!!addErrors.Title}
                  helperText={addErrors.Title ? 'This field is required' : ''}
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
              name='ImageUrl'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='ImageUrl'
                  placeholder='Enter ImageUrl'
                  error={!!addErrors.ImageUrl}
                  helperText={addErrors.ImageUrl ? 'This field is required' : ''}
                />
              )}
            />
            <Controller
              name='Link'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Link'
                  placeholder='Enter Link'
                  error={!!addErrors.Link}
                  helperText={addErrors.Link ? 'This field is required' : ''}
                />
              )}
            />
            <Controller
              name='Date'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label='Date'
                    value={field.value}
                    onChange={date => field.onChange(date)}
                    renderInput={params => <TextField {...params} />}
                  />
                </LocalizationProvider>
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
              <Button variant='contained' type='submit' disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Submit'}
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Edit Blog Drawer (Previously a Dialog) */}
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
            Edit Blog
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='BlogID'
              control={editControl}
              render={({ field }) => <TextField {...field} margin='dense' label='Blog ID' fullWidth disabled />}
            />
            <Controller
              name='Title'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Title'
                  fullWidth
                  error={!!editErrors.Title}
                  helperText={editErrors.Title ? 'This field is required' : ''}
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
              name='ImageUrl'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='ImageUrl'
                  fullWidth
                  error={!!editErrors.ImageUrl}
                  helperText={editErrors.ImageUrl ? 'This field is required' : ''}
                />
              )}
            />
            <Controller
              name='Link'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Link'
                  fullWidth
                  error={!!editErrors.Link}
                  helperText={editErrors.Link ? 'This field is required' : ''}
                />
              )}
            />
            <Controller
              name='Date'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label='Date'
                    value={field.value} // Set the value from the edit form
                    onChange={date => field.onChange(date)}
                    renderInput={params => <TextField {...params} />}
                  />
                </LocalizationProvider>
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
        Blogs Form
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
            placeholder='Search Blogs'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          /> */}
          <Button variant='contained' onClick={() => setAddBlogOpen(!addBlogOpen)} className='is-full sm:is-auto'>
            Add New Blog
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
                        {header.id === 'Title' && // Conditionally render icon
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
      <Snackbar open={toastOpen} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default BlogFilterPage
