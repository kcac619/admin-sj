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

const PurityFilterPage = () => {
  const theme = useTheme()
  const [purity, setPurity] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [filteredPurity, setFilteredPurity] = useState([
    { PurityName: 'Loading...', PurityID: 'Loading...', IsActive: false }
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [addPurityOpen, setAddPurityOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [purityToEdit, setPurityToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [purityToDelete, setPurityToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['PurityName', 'asc']]) // Default sorting

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastSeverity, setToastSeverity] = useState('success') // 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('')

  // useForm for Add Purity
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      PurityName: ''
    }
  })

  // useForm for Edit Purity
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      PurityID: '',
      PurityName: ''
    }
  })

  // Handle Add Purity Form Submission
  const onAddSubmit = async data => {
    setIsAdding(true)
    try {
      const response = await axios.post('/api/filters/purity', {
        PurityName: data.PurityName,
        CreatedBy: 1, // Replace with the actual user ID
        CompanyID: 1 // Replace with the actual company ID
      })

      if (response.data.statusid === 1) {
        fetchPurity() // Update the UI after successful addition
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
      console.error('Error creating purity:', error)
      setError('Error creating purity')
      setToastSeverity('error')
      setToastMessage('Error creating purity. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Purity Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const response = await axios.put('/api/filters/purity', {
        PurityID: parseInt(data.PurityID),
        PurityName: data.PurityName,
        ModifiedBy: 1 // Replace with the actual user ID
      })

      if (response.data.statusid === 1) {
        fetchPurity() // Update the UI after successful editing
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
      console.error('Error updating purity:', error)
      setError('Error updating purity')
      setToastSeverity('error')
      setToastMessage('Error updating purity. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (purityId, newIsActive) => {
    try {
      const response = await axios.put('/api/filters/purity-active', {
        purityId,
        isActive: newIsActive
      })

      if (response.data.statusid === 1) {
        // Update the purity data in the UI
        setPurity(prevPurity =>
          prevPurity.map(purity => (purity.PurityID === purityId ? { ...purity, IsActive: newIsActive } : purity))
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
      setToastMessage('Error updating purity active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Purity Data from Database
  const fetchPurity = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/purity')

      if (response.data.statusid === 1) {
        setPurity(response.data.purity)
        setFilteredPurity(response.data.purity)
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
      console.error('Error fetching purity:', error)
      setError('Error fetching purity')
      setToastSeverity('error')
      setToastMessage('Error fetching purity. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPurity()
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  useEffect(() => {
    const filteredData = purity.filter(purity => purity.PurityName.toLowerCase().includes(globalFilter.toLowerCase()))
    setFilteredPurity(filteredData)
  }, [globalFilter, purity])

  // Handle Edit Purity
  const handleEdit = purity => {
    setPurityToEdit(purity)
    resetEditForm({
      PurityID: purity.PurityID,
      PurityName: purity.PurityName
    })
    setEditModalOpen(true)
  }

  // Handle Delete Purity
  const handleDelete = purityId => {
    setPurityToDelete(purityId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (purityToDelete) {
        const response = await axios.delete(`/api/filters/purity?purityId=${purityToDelete}`)
        if (response.data.statusid === 1) {
          fetchPurity() // Update the UI after successful deletion
          setPurityToDelete(null)
          setToastSeverity('success')
          setToastMessage(response.data.statusmessage)
          setToastOpen(true)
        } else {
          setError(response.data.statusmessage)
          setToastSeverity('error')
          setToastMessage(response.data.statusmessage)
          setToastOpen(true)
        }
      }
    } catch (error) {
      console.error('Error deleting purity:', error)
      setError('Error deleting purity')
      setToastSeverity('error')
      setToastMessage('Error deleting purity. Please try again later.')
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
      columnHelper.accessor('PurityName', {
        // Using accessor for PurityName
        header: 'Purity Name',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.PurityID, e.target.checked)}
              />
            }
            label=''
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
            {isDeleting && purityToDelete === row.original.PurityID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.PurityID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [isDeleting, purityToDelete]
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
    data: filteredPurity,
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

  // Close Drawer (Add Purity)
  const handleClose = () => {
    setAddPurityOpen(false)
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
          <DialogContentText>Are you sure you want to delete this purity?</DialogContentText>
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

      {/* Add Purity Drawer */}
      <Drawer
        open={addPurityOpen}
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
          <Typography variant='h5'>Add New Purity</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='PurityName'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Purity Name'
                  placeholder='Enter Purity Name'
                  error={!!addErrors.PurityName}
                  helperText={addErrors.PurityName ? 'This field is required' : ''}
                />
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

      {/* Edit Purity Drawer */}
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
            Edit Purity
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='PurityID'
              control={editControl}
              render={({ field }) => <TextField {...field} margin='dense' label='Purity ID' fullWidth disabled />}
            />
            <Controller
              name='PurityName'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Purity Name'
                  fullWidth
                  error={!!editErrors.PurityName}
                  helperText={editErrors.PurityName ? 'This field is required' : ''}
                />
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
        Purity Form
      </Typography>
      <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
        <Button
          color='secondary'
          variant='outlined'
          sx={{ borderColor: 'gray', color: 'gray' }}
          startIcon={<i className='ri-upload-2-line' />}
          className='is-full sm:is-auto'
          onClick={exportData}
        >
          Export
        </Button>
        <div className='flex items-center gap-x-4 max-sm:gap-y-4 is-full flex-col sm:is-auto sm:flex-row'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Purity'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          />
          <Button variant='contained' onClick={() => setAddPurityOpen(!addPurityOpen)} className='is-full sm:is-auto'>
            Add New Purity
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

                        {/* Render Remix Icons for Sorting ONLY for PurityName column */}
                        {header.id === 'PurityName' && // Conditionally render icon
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

              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    style={{ padding: 0, margin: 0 }}
                    // className={row.original.IsDeleted ? 'deleted-row' : ''} // No IsDeleted for now
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

export default PurityFilterPage
