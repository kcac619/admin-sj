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
import Select from 'react-select'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
// React Table Imports
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { DialogContentText, MenuItem } from '@mui/material'

// Define column helper
const columnHelper = createColumnHelper()

// Alert Component
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const PairFilterPage = () => {
  const theme = useTheme()
  const [pairs, setPairs] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [globalFilter, setGlobalFilter] = useState('')
  const [addPairOpen, setAddPairOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [pairToEdit, setPairToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [pairToDelete, setPairToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['PairID', 'asc']]) // Default sorting

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastSeverity, setToastSeverity] = useState('success') // 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('')

  // Filter Data (Initially Empty - will be fetched)
  const [solitaires, setSolitaires] = useState([])

  // useForm for Add Pair
  const {
    control,
    register,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      PairName: '',
      SolitaireIDs: [{ SolitaireID: '' }] // Start with one SolitaireID field
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'SolitaireIDs'
  })

  // useForm for Edit Pair
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      PairID: '',
      PairName: '',
      SolitaireIDs: [{ SolitaireID: '' }] // Start with one SolitaireID field
    }
  })

  const {
    fields: editFields,
    append: editAppend,
    remove: editRemove
  } = useFieldArray({
    control: editControl,
    name: 'SolitaireIDs'
  })

  // Fetch Data for All Filters
  const fetchAllFilterData = async () => {
    setIsFilterDataLoading(true)
    try {
      const solitairesResponse = await axios.get('/api/filters/solitaires')
      if (solitairesResponse.data.statusid === 1) {
        setSolitaires(solitairesResponse.data.solitaires)
      } else {
        console.error('Error fetching solitaires:', solitairesResponse.data.statusmessage)
        setToastSeverity('error')
        setToastMessage('Error fetching solitaires. Please try again later.')
        setToastOpen(true)
      }

      setIsFilterDataLoading(false)
    } catch (error) {
      console.error('Error fetching filter data:', error)
      setToastSeverity('error')
      setToastMessage('Error fetching filter data. Please try again later.')
      setToastOpen(true)
      setIsFilterDataLoading(false)
    }
  }
  // Handle Add Pair Form Submission
  const onAddSubmit = async data => {
    setIsAdding(true)
    try {
      const response = await axios.post('/api/filters/pairs', {
        PairName: data.PairName,
        SolitaireIDs: data.SolitaireIDs.map(item => parseInt(item.SolitaireID)),
        CreatedBy: 1, // Replace with the actual user ID
        CompanyID: 1 // Replace with the actual company ID
      })

      if (response.data.statusid === 1) {
        fetchPairs() // Update the UI after successful addition
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
      console.error('Error creating pair:', error)
      setError('Error creating pair')
      setToastSeverity('error')
      setToastMessage('Error creating pair. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Pair Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const response = await axios.put('/api/filters/pairs', {
        PairID: parseInt(data.PairID),
        PairName: data.PairName,
        SolitaireIDs: data.SolitaireIDs.map(item => parseInt(item.SolitaireID)),
        ModifiedBy: 1 // Replace with the actual user ID
      })
      if (response.data.statusid === 1) {
        fetchPairs() // Update the UI after successful editing
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
      console.error('Error updating pair:', error)
      setError('Error updating pair')
      setToastSeverity('error')
      setToastMessage('Error updating pair. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (pairId, newIsActive) => {
    try {
      const response = await axios.put('/api/filters/pairs-active', {
        pairId,
        isActive: newIsActive
      })

      if (response.data.statusid === 1) {
        // Update the pairs data in the UI
        setPairs(prevPairs =>
          prevPairs.map(pair => (pair.PairID === pairId ? { ...pair, IsActive: newIsActive } : pair))
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
      setToastMessage('Error updating pair active status. Please try again.')
      setToastOpen(true)
    }
  }
  useEffect(() => {
    console.log('pairs data : ', pairs)
  }, [pairs])

  // Fetch Pairs Data
  const fetchPairs = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/pairs')
      console.log('response', response)
      if (response.data.statusid === 1) {
        // Group solitaires by PairID
        const pairsData = response.data.pairs

        setPairs(pairsData)
        console.log('pairs fetched: ', pairsData)
        // setToastSeverity('success')
        // setToastMessage(response.data.statusmessage)
        // setToastOpen(true)
      } else {
        setError(response.data.statusmessage)
        setToastSeverity('error')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error fetching pairs:', error)
      setError('Error fetching pairs')
      setToastSeverity('error')
      setToastMessage('Error fetching pairs. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllFilterData() // Fetch all filter data when the component mounts
    fetchPairs()
    // console.log('shapes state: ', shapes)
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  // Handle Edit Pair
  const handleEdit = pair => {
    setPairToEdit(pair)
    console.log(pair)
    // Create an array of objects for SolitaireIDs, matching the format used in useFieldArray
    const initialSolitaireIDs = pair.SolitaireIDs.map(id => ({ SolitaireID: id.toString() }))

    resetEditForm({
      PairID: pair.PairID,
      PairName: pair.PairName,
      SolitaireIDs: initialSolitaireIDs // Set SolitaireIDs as an array of objects
    })
    setEditModalOpen(true)
  }
  // Handle Delete Pair
  const handleDelete = pairId => {
    setPairToDelete(pairId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (pairToDelete) {
        const response = await axios.delete(`/api/filters/pairs?pairId=${pairToDelete}`)

        if (response.data.statusid === 1) {
          fetchPairs() // Update the UI after successful deletion
          setPairToDelete(null)
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
      console.error('Error deleting pair:', error)
      setError('Error deleting pair')
      setToastSeverity('error')
      setToastMessage('Error deleting pair. Please try again later.')
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
      columnHelper.accessor('PairName', {
        // Using accessor for PairName
        header: 'Pair Name',
        cell: info => info.getValue()
      }),

      //   ...Array.from({ length: 6 }, (_, i) =>
      //   columnHelper.accessor(`SolitaireID${i + 1}`, {
      //     header: `Solitaire ${i + 1}`,
      //     cell: info => {
      //       // Find the SolitaireName from the solitaires array using SolitaireID
      //       const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
      //       //   console.log('solitaire', solitaire)
      //       return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
      //     },
      //     sortType: 'basic' // Enable basic sorting (string)
      //   })
      // ),
      columnHelper.accessor('Solitaires', {
        // Use accessor to get Solitaires data
        header: 'Solitaires',
        cell: ({ row }) => {
          // Access the SolitaireNames from the row data
          const solitaireNames = row.original.SolitaireNames || []

          // Check if there are any SolitaireNames associated with this pair
          if (solitaireNames.length === 0) {
            return <Typography variant='body2'>No Solitaires</Typography>
          }

          // Render Accordion
          return (
            <Accordion
              disableGutters // Remove default Accordion padding
              elevation={0} // No box shadow
              sx={{
                '&::before': {
                  display: 'none' // Hide the default Accordion border
                },
                '&.Mui-expanded': {
                  margin: 0, // Prevent margin changes when expanded
                  boxShadow: 'none' // Remove box shadow
                },
                boxShadow: 'none' // Remove box shadow
              }}
            >
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                {/* You can customize the summary content */}
                <Typography variant='body2'>
                  {/* Display the first 3 SolitaireNames (or less if there are fewer) */}
                  {solitaireNames.slice(0, 1).join(', ')}
                  {/* Display "... and more" if there are more than 3 SolitaireNames */}
                  {solitaireNames.length > 1 && '... and more'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Display all SolitaireNames separated by commas */}
                <Typography variant='body2'>{solitaireNames.join(', ')}</Typography>
              </AccordionDetails>
            </Accordion>
          )
        },
        sortType: 'basic' // Enable basic sorting (string) for Solitaires
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.PairID, e.target.checked)}
              />
            }
            label=''
          />
        ),
        sortType: 'basic'
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex space-x-2 justify-center'>
            {/* Edit Button with Conditional Spinner */}
            {isFilterDataLoading ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleEdit(row.original)} color='primary'>
                <i className='ri-edit-box-line' />
              </IconButton>
            )}
            {isDeleting && pairToDelete === row.original.PairID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.PairID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [isDeleting, pairToDelete, solitaires]
  )

  // React Table Instance
  const table = useReactTable({
    data: pairs,
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

  // Close Drawer (Add Pair)
  const handleClose = () => {
    setAddPairOpen(false)
    resetAddForm()
    setEditModalOpen(false)
    resetEditForm()
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
          <DialogContentText>Are you sure you want to delete this pair?</DialogContentText>
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

      {/* Add Pair Drawer */}
      <Drawer
        open={addPairOpen}
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
          <Typography variant='h5'>Add New Pair</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='PairName'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Pair Name'
                  placeholder='Enter Pair Name'
                  error={!!addErrors.PairName}
                  helperText={addErrors.PairName ? 'This field is required' : ''}
                />
              )}
            />

            {fields.map((field, index) => {
              return (
                <div key={field.id} className='flex items-center'>
                  <Controller
                    name={`SolitaireIDs.${index}.SolitaireID`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                      const options = solitaires.map(solitaire => ({
                        value: solitaire.SolitaireID.toString(),
                        label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}` // Display both ID and ShapeName
                      }))
                      return (
                        <Select
                          {...field}
                          options={options}
                          placeholder={`Select Solitaire ${index + 1}`}
                          isSearchable
                          onChange={selectedOption => field.onChange(selectedOption ? selectedOption.value : '')}
                          value={options.find(option => option.value === field.value?.toString())}
                          styles={
                            {
                              // ... your existing styles ...
                            }
                          }
                        />
                      )
                    }}
                  />
                  {index < 5 && (
                    <IconButton
                      onClick={() => append({ SolitaireID: '' })}
                      sx={{ marginLeft: '10px' }} // Adjust margin as needed
                    >
                      <i className='ri-add-circle-line' />
                    </IconButton>
                  )}
                  {index > 0 && (
                    <IconButton onClick={() => remove(index)} color='error'>
                      <i className='ri-close-circle-line' />
                    </IconButton>
                  )}
                </div>
              )
            })}

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

      {/* Edit Pair Drawer (Previously a Dialog) */}
      <Drawer
        open={editModalOpen && !isFilterDataLoading}
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
            Edit Pair
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='PairID'
              control={editControl}
              render={({ field }) => <TextField {...field} margin='dense' label='Pair ID' fullWidth disabled />}
            />
            <Controller
              name='PairName'
              control={editControl}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin='dense'
                  label='Pair Name'
                  fullWidth
                  error={!!editErrors.PairName}
                  helperText={editErrors.PairName ? 'This field is required' : ''}
                />
              )}
            />

            {editFields.map((field, index) => {
              return (
                <div key={field.id} className='flex items-center'>
                  <Controller
                    name={`SolitaireIDs.${index}.SolitaireID`}
                    control={editControl}
                    rules={{ required: true }}
                    render={({ field }) => {
                      const options = solitaires.map(solitaire => ({
                        value: solitaire.SolitaireID.toString(),
                        label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}` // Display both ID and ShapeName
                      }))

                      return (
                        <Select
                          {...field}
                          options={options}
                          placeholder={`Select Solitaire ${index + 1}`}
                          isSearchable
                          onChange={selectedOption => field.onChange(selectedOption ? selectedOption.value : '')}
                          value={options.find(option => option.value === field.value)}
                          styles={
                            {
                              // ... your existing styles ...
                            }
                          }
                        />
                      )
                    }}
                  />
                  {index < 5 && (
                    <IconButton
                      onClick={() => editAppend({ SolitaireID: '' })}
                      sx={{ marginLeft: '10px' }} // Adjust margin as needed
                    >
                      <i className='ri-add-circle-line' />
                    </IconButton>
                  )}
                  {index > 0 && (
                    <IconButton onClick={() => editRemove(index)} color='error'>
                      <i className='ri-close-circle-line' />
                    </IconButton>
                  )}
                </div>
              )
            })}

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
        Pair Form
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
          {/* <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Pairs'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          /> */}
          <Button
            variant='contained'
            onClick={() => setAddPairOpen(!addPairOpen)}
            className='is-full sm:is-auto'
            disabled={isFilterDataLoading} // Disable Add button while loading
          >
            {isFilterDataLoading ? 'Loading...' : 'Add New Pair'}
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
                        {/* Correctly display header and icon */}
                        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                          {' '}
                          {/* Align icon with text */}
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {/* Only show icon if column is sortable */}
                          {header.column.getCanSort() && (
                            <span className='ml-2'>
                              {header.column.getIsSorted() === 'asc' ? (
                                <i className='ri-arrow-up-s-line'></i>
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <i className='ri-arrow-down-s-line'></i>
                              ) : (
                                <i className='ri-expand-up-down-line'></i>
                              )}
                            </span>
                          )}
                        </div>
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
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#555'
                          //   alignContent: 'center',
                          //   textAlign: 'center',
                          //   alignItems: 'center'
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

export default PairFilterPage
