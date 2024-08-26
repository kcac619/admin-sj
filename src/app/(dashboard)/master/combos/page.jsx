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
import Select from 'react-select'

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
import { DialogContentText, MenuItem } from '@mui/material'

// Define column helper
const columnHelper = createColumnHelper()

// Alert Component
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const ComboFilterPage = () => {
  const theme = useTheme()
  const [combos, setCombos] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [globalFilter, setGlobalFilter] = useState('')
  const [addComboOpen, setAddComboOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [comboToEdit, setComboToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [comboToDelete, setComboToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['ComboID', 'asc']]) // Default sorting

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
  const [shapes, setShapes] = useState([])
  const [carats, setCarats] = useState([])
  const [colors, setColors] = useState([])
  const [flours, setFlours] = useState([])
  const [purities, setPurities] = useState([])
  const [cuts, setCuts] = useState([])
  const [labs, setLabs] = useState([])
  const [polishs, setPolishs] = useState([])
  const [symms, setSymms] = useState([])
  const [locations, setLocations] = useState([])
  const [solitaires, setSolitaires] = useState([])

  // useForm for Add Combo
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      SolitaireID1: '',
      SolitaireID2: '',
      SolitaireID3: '',
      SolitaireID4: '',
      SolitaireID5: '',
      SolitaireID6: ''
    }
  })

  // useForm for Edit Combo
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      ComboID: '',
      SolitaireID1: '',
      SolitaireID2: '',
      SolitaireID3: '',
      SolitaireID4: '',
      SolitaireID5: '',
      SolitaireID6: ''
    }
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
      //   setToastSeverity('success')
      //   setToastMessage('Filter data fetched successfully.')
      //   setToastOpen(true)
    } catch (error) {
      console.error('Error fetching filter data:', error)
      // Display error toast
      setToastSeverity('error')
      setToastMessage('Error fetching filter data. Please try again later.')
      setToastOpen(true)
      setIsFilterDataLoading(false)
    }
  }

  // Handle Add Combo Form Submission
  const onAddSubmit = async data => {
    setIsAdding(true)
    try {
      const response = await axios.post('/api/filters/combos', {
        SolitaireID1: parseInt(data.SolitaireID1) || null,
        SolitaireID2: parseInt(data.SolitaireID2) || null,
        SolitaireID3: parseInt(data.SolitaireID3) || null,
        SolitaireID4: parseInt(data.SolitaireID4) || null,
        SolitaireID5: parseInt(data.SolitaireID5) || null,
        SolitaireID6: parseInt(data.SolitaireID6) || null,
        CreatedBy: 1, // Replace with the actual user ID
        CompanyID: 1 // Replace with the actual company ID
      })

      if (response.data.statusid === 1) {
        fetchCombos() // Update the UI after successful addition
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
      console.error('Error creating combo:', error)
      setError('Error creating combo')
      setToastSeverity('error')
      setToastMessage('Error creating combo. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Combo Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const response = await axios.put('/api/filters/combos', {
        ComboID: parseInt(data.ComboID),
        SolitaireID1: parseInt(data.SolitaireID1) || null,
        SolitaireID2: parseInt(data.SolitaireID2) || null,
        SolitaireID3: parseInt(data.SolitaireID3) || null,
        SolitaireID4: parseInt(data.SolitaireID4) || null,
        SolitaireID5: parseInt(data.SolitaireID5) || null,
        SolitaireID6: parseInt(data.SolitaireID6) || null,
        ModifiedBy: 1 // Replace with the actual user ID
      })

      if (response.data.statusid === 1) {
        fetchCombos() // Update the UI after successful editing
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
      console.error('Error updating combo:', error)
      setError('Error updating combo')
      setToastSeverity('error')
      setToastMessage('Error updating combo. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (comboId, newIsActive) => {
    try {
      const response = await axios.put('/api/filters/combos-active', {
        comboId,
        isActive: newIsActive
      })

      if (response.data.statusid === 1) {
        // Update the combos data in the UI
        setCombos(prevCombos =>
          prevCombos.map(combo => (combo.ComboID === comboId ? { ...combo, IsActive: newIsActive } : combo))
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
      setToastMessage('Error updating combo active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Combos Data
  const fetchCombos = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/combos')

      if (response.data.statusid === 1) {
        setCombos(response.data.combos)
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
      console.error('Error fetching combos:', error)
      setError('Error fetching combos')
      setToastSeverity('error')
      setToastMessage('Error fetching combos. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllFilterData() // Fetch all filter data when the component mounts
    fetchCombos()
    // console.log('shapes state: ', shapes)
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  //   useEffect(() => {
  //     console.log('combos state: ', combos)
  //   }, [combos])

  // Handle Edit Combo
  const handleEdit = combo => {
    setComboToEdit(combo)
    console.log(combo, 'combo')
    resetEditForm({
      ComboID: combo.ComboID,
      SolitaireID1: combo.SolitaireID1?.toString() || '',
      SolitaireID2: combo.SolitaireID2?.toString() || '',
      SolitaireID3: combo.SolitaireID3?.toString() || '',
      SolitaireID4: combo.SolitaireID4?.toString() || '',
      SolitaireID5: combo.SolitaireID5?.toString() || '',
      SolitaireID6: combo.SolitaireID6?.toString() || ''
    })
    setEditModalOpen(true)
  }

  // Handle Delete Combo
  const handleDelete = comboId => {
    setComboToDelete(comboId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (comboToDelete) {
        const response = await axios.delete(`/api/filters/combos?comboId=${comboToDelete}`)

        if (response.data.statusid === 1) {
          fetchCombos() // Update the UI after successful deletion
          setComboToDelete(null)
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
      console.error('Error deleting combo:', error)
      setError('Error deleting combo')
      setToastSeverity('error')
      setToastMessage('Error deleting combo. Please try again later.')
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

      columnHelper.accessor('SolitaireID1', {
        header: 'Solitaire 1',
        cell: info => {
          // Find the SolitaireName from the solitaires array using SolitaireID
          const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
          return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
        },
        sortType: 'basic'
      }),
      columnHelper.accessor('SolitaireID2', {
        header: 'Solitaire 2',
        cell: info => {
          // Find the SolitaireName from the solitaires array using SolitaireID
          const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
          return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
        },
        sortType: 'basic'
      }),
      columnHelper.accessor('SolitaireID3', {
        header: 'Solitaire 3',
        cell: info => {
          // Find the SolitaireName from the solitaires array using SolitaireID
          const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
          return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
        },
        sortType: 'basic'
      }),
      columnHelper.accessor('SolitaireID4', {
        header: 'Solitaire 4',
        cell: info => {
          // Find the SolitaireName from the solitaires array using SolitaireID
          const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
          return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
        },
        sortType: 'basic'
      }),
      columnHelper.accessor('SolitaireID5', {
        header: 'Solitaire 5',
        cell: info => {
          // Find the SolitaireName from the solitaires array using SolitaireID
          const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
          return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
        },
        sortType: 'basic'
      }),
      columnHelper.accessor('SolitaireID6', {
        header: 'Solitaire 6',
        cell: info => {
          // Find the SolitaireName from the solitaires array using SolitaireID
          const solitaire = solitaires.find(s => s.SolitaireID === info.getValue())
          return solitaire ? `${solitaire.SolitaireID} - ${solitaire.ShapeName}` : 'N/A'
        },
        sortType: 'basic'
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.ComboID, e.target.checked)}
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
            {isDeleting && comboToDelete === row.original.ComboID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.ComboID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [isDeleting, comboToDelete, solitaires]
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
    data: combos,
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

  // Close Drawer (Add Combo)
  const handleClose = () => {
    setAddComboOpen(false)
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
          <DialogContentText>Are you sure you want to delete this combo?</DialogContentText>
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

      {/* Add Combo Drawer */}
      <Drawer
        open={addComboOpen}
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
          <Typography variant='h5'>Add New Combo</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* SolitaireID1 Controller */}
              <Controller
                name='SolitaireID1'
                control={control}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 1'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />

              {/* SolitaireID2 Controller */}
              <Controller
                name='SolitaireID2'
                control={control}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 2'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
              {/* SolitaireID3 Controller */}
              <Controller
                name='SolitaireID3'
                control={control}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 3'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />

              {/* SolitaireID4 Controller */}
              <Controller
                name='SolitaireID4'
                control={control}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 4'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />

              {/* SolitaireID5 Controller */}
              <Controller
                name='SolitaireID5'
                control={control}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 5'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
              {/* SolitaireID6 Controller */}
              <Controller
                name='SolitaireID6'
                control={control}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 6'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
            </div>
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

      {/* Edit Combo Drawer (Previously a Dialog) */}
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
            Edit Combo
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* SolitaireID1 Controller */}
              <Controller
                name='SolitaireID1'
                control={editControl}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 1'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />

              {/* SolitaireID2 Controller */}
              <Controller
                name='SolitaireID2'
                control={editControl}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 2'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
              {/* SolitaireID3 Controller */}
              <Controller
                name='SolitaireID3'
                control={editControl}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 3'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
              {/* SolitaireID4 Controller */}
              <Controller
                name='SolitaireID4'
                control={editControl}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 4'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />

              {/* SolitaireID5 Controller */}
              <Controller
                name='SolitaireID5'
                control={editControl}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 5'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
              {/* SolitaireID6 Controller */}
              <Controller
                name='SolitaireID6'
                control={editControl}
                render={({ field }) => {
                  const options = solitaires.map(solitaire => ({
                    value: solitaire.SolitaireID.toString(),
                    label: `${solitaire.SolitaireID} - ${solitaire.ShapeName}`
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Solitaire 6'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided, // Spread default styles
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // Apply your background color
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444', // Apply your text color
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)' // Focus style
                          // ... other styles ...
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff', // Apply your background color to the menu
                          zIndex: 9999 // Set a high z-index to prevent transparency issues
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33' // Selected background color (dark mode)
                              : 'rgba(0, 0, 0, 0.08)' // Selected background color (light mode)
                            : provided.backgroundColor,
                          color: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#fff' // Selected text color (dark mode)
                              : '#000' // Selected text color (light mode)
                            : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                        // ... [Style other parts of the component as needed] ...
                      }}
                    />
                  )
                }}
              />
            </div>

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
        Combo Form
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
            placeholder='Search Combos'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          /> */}
          <Button
            variant='contained'
            onClick={() => setAddComboOpen(!addComboOpen)}
            className='is-full sm:is-auto'
            disabled={isFilterDataLoading}
          >
            {isFilterDataLoading ? 'Loading...' : 'Add New Combo'}
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
                        <div style={{ display: 'flex', alignItems: 'center' }}>
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

export default ComboFilterPage
