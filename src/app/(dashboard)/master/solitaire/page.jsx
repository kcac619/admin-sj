'use client'
import { useTheme } from '@mui/material/styles'
import primaryColorConfig from '../../../../configs/primaryColorConfig'
import React, { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'

import Select from 'react-select'

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
import { Controller, set, useForm } from 'react-hook-form'
import { DialogContentText, MenuItem } from '@mui/material'

// Define column helper
const columnHelper = createColumnHelper()

// Alert Component
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const SolitaireFilterPage = () => {
  const theme = useTheme()
  const [solitaires, setSolitaires] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [globalFilter, setGlobalFilter] = useState('')
  const [addSolitaireOpen, setAddSolitaireOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [solitaireToEdit, setSolitaireToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [solitaireToDelete, setSolitaireToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['SolitaireID', 'asc']]) // Default sorting

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
  const [certificateNumbers, setCertificateNumbers] = useState([])

  // useForm for Add Solitaire
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      ShapeID: '',
      Carat: '',
      ColorID: '',
      FluorID: '',
      PurityID: '',
      CutID: '',
      LabID: '',
      PolishID: '',
      SymmetryID: '',
      LocationID: '',
      CertificateNumber: '',
      Image1: null,
      Image2: null,
      Image3: null,
      Image4: null,
      Image5: null
    }
  })

  // useForm for Edit Solitaire
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      SolitaireID: '',
      ShapeID: '',
      Carat: '',
      ColorID: '',
      FluorID: '',
      PurityID: '',
      CutID: '',
      LabID: '',
      PolishID: '',
      SymmetryID: '',
      LocationID: '',
      CertificateNumber: '',
      Image1: null,
      Image2: null,
      Image3: null,
      Image4: null,
      Image5: null
    }
  })

  const isCertificateNumberUnique = certificateNumber => {
    return !solitaires.some(s => s.CertificateNumber === certificateNumber)
  }
  const isCertificateNumberUniqueForEdit = (certificateNumber, solitaireId) => {
    return !solitaires.some(s => s.SolitaireID !== solitaireId && s.CertificateNumber === certificateNumber) // Exclude current ID
  }
  // Fetch Data for All Filters
  const fetchAllFilterData = async () => {
    try {
      //   const solitaireResponse = await axios.get('/api/filters/solitaires')
      //   console.log('solitaireResponse:', solitaireResponse)
      //   if (solitaireResponse.data.statusid === 1) {
      //     setSolitaires(solitaireResponse.data.solitaires)
      //   } else {
      //     console.error('Error fetching solitaires:', solitaireResponse.data.statusmessage)
      //   }
      setIsFilterDataLoading(true)
      const shapeResponse = await axios.get('/api/filters/shapes')
      //   console.log('shapeResponse:', shapeResponse)
      if (shapeResponse.data.statusid === 1) {
        // console.log('Shapes:', shapeResponse.data.shapes)
        setShapes(shapeResponse.data.shapes)
      } else {
        console.error('Error fetching shapes:', shapeResponse.data.statusmessage)
      }

      const caratResponse = await axios.get('/api/filters/carat')
      if (caratResponse.data.statusid === 1) {
        setCarats(caratResponse.data.carats)
      } else {
        console.error('Error fetching carats:', caratResponse.data.statusmessage)
      }

      const colorResponse = await axios.get('/api/filters/colors')
      if (colorResponse.data.statusid === 1) {
        setColors(colorResponse.data.colors)
      } else {
        console.error('Error fetching colors:', colorResponse.data.statusmessage)
      }

      const fluorResponse = await axios.get('/api/filters/fluor')
      if (fluorResponse.data.statusid === 1) {
        setFlours(fluorResponse.data.fluor)
      } else {
        console.error('Error fetching flours:', fluorResponse.data.statusmessage)
      }

      const purityResponse = await axios.get('/api/filters/purity')
      if (purityResponse.data.statusid === 1) {
        setPurities(purityResponse.data.purity)
      } else {
        console.error('Error fetching purities:', purityResponse.data.statusmessage)
      }

      const cutResponse = await axios.get('/api/filters/cut')
      if (cutResponse.data.statusid === 1) {
        setCuts(cutResponse.data.cut)
      } else {
        console.error('Error fetching cuts:', cutResponse.data.statusmessage)
      }

      const labResponse = await axios.get('/api/filters/lab')
      if (labResponse.data.statusid === 1) {
        setLabs(labResponse.data.lab)
      } else {
        console.error('Error fetching labs:', labResponse.data.statusmessage)
      }

      const polishResponse = await axios.get('/api/filters/polish')
      if (polishResponse.data.statusid === 1) {
        setPolishs(polishResponse.data.polish)
      } else {
        console.error('Error fetching polishs:', polishResponse.data.statusmessage)
      }

      const symmResponse = await axios.get('/api/filters/symmetry')
      if (symmResponse.data.statusid === 1) {
        setSymms(symmResponse.data.symmetry)
      } else {
        console.error('Error fetching symms:', symmResponse.data.statusmessage)
      }

      const locationResponse = await axios.get('/api/filters/location')
      if (locationResponse.data.statusid === 1) {
        setLocations(locationResponse.data.location)
      } else {
        console.error('Error fetching locations:', locationResponse.data.statusmessage)
      }
      setIsFilterDataLoading(false)
      setToastSeverity('success')
      setToastMessage('Filter data fetched successfully.')
      setToastOpen(true)
    } catch (error) {
      console.error('Error fetching filter data:', error)
      // Display error toast
      setToastSeverity('error')
      setToastMessage('Error fetching filter data. Please try again later.')
      setToastOpen(true)
      setIsFilterDataLoading(false)
    }
  }

  // Handle Add Solitaire Form Submission
  const imageFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
  const fileReaderRefs = imageFields.map(() => useRef(null))

  const onAddSubmit = async data => {
    setIsAdding(true)

    // Check if the certificate number is unique
    if (!isCertificateNumberUnique(data.CertificateNumber)) {
      setError('Certificate number must be unique.')
      setToastSeverity('error')
      setToastMessage('Certificate number must be unique.')
      setToastOpen(true)
      setIsAdding(false)
      return
    }

    try {
      const formData = new FormData() // Create FormData object
      formData.append('ShapeID', parseInt(data.ShapeID))
      formData.append('Carat', parseFloat(data.Carat))
      formData.append('ColorID', parseInt(data.ColorID))
      formData.append('FluorID', parseInt(data.FluorID))
      formData.append('PurityID', parseInt(data.PurityID))
      formData.append('CutID', parseInt(data.CutID))
      formData.append('LabID', parseInt(data.LabID))
      formData.append('PolishID', parseInt(data.PolishID))
      formData.append('SymmetryID', parseInt(data.SymmetryID))
      formData.append('LocationID', parseInt(data.LocationID))
      formData.append('CertificateNumber', data.CertificateNumber)

      // Handle image uploads
      for (let i = 0; i < imageFields.length; i++) {
        const imageField = imageFields[i]
        const fileReaderRef = fileReaderRefs[i] // Get the ref for this image

        if (data[imageField] && data[imageField][0]) {
          console.log('data[imageField][0]:', data[imageField][0])
          const file = data[imageField][0]

          if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            alert('Only JPG, PNG, and GIF files are allowed.')
            return
          }
          if (file.size > 1 * 1024 * 1024) {
            // 1MB
            alert('File size should not exceed 1MB.')
            return
          }

          // Create the FileReader instance outside the onloadend
          fileReaderRef.current = new FileReader()

          // Convert image to Base64 using FileReader
          fileReaderRef.current.readAsDataURL(file)

          // Wait for the file to be read
          await new Promise(resolve => {
            fileReaderRef.current.onloadend = () => {
              const base64data = fileReaderRef.current.result
              const imageData = {
                fileName: `${Date.now()}-${file.name}`,
                mimeType: file.type,
                base64: base64data
              }
              formData.append(imageField, JSON.stringify(imageData))
              resolve()
            }
          })
        }
      }
      formData.append('CreatedBy', 1) // Replace with the actual user ID
      formData.append('CompanyID', 1) // Replace with the actual company ID

      const response = await axios.post('/api/filters/solitaires', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      })

      if (response.data.statusid === 1) {
        fetchSolitaires() // Update the UI after successful addition
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
      console.error('Error creating solitaire:', error)
      setError('Error creating solitaire')
      setToastSeverity('error')
      setToastMessage('Error creating solitaire. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }
  // Handle Edit Solitaire Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const formData = new FormData()

      // Check if the certificate number is unique
      if (!isCertificateNumberUniqueForEdit(data.CertificateNumber, parseInt(data.SolitaireID))) {
        setError('Certificate number must be unique.')
        setToastSeverity('error')
        setToastMessage('Certificate number must be unique.')
        setToastOpen(true)
        setIsEditing(false) // Reset the isEditing state
        return // Stop further execution
      }

      formData.append('SolitaireID', parseInt(data.SolitaireID))
      formData.append('ShapeID', parseInt(data.ShapeID))
      formData.append('Carat', parseFloat(data.Carat))
      formData.append('ColorID', parseInt(data.ColorID))
      formData.append('FluorID', parseInt(data.FluorID))
      formData.append('PurityID', parseInt(data.PurityID))
      formData.append('CutID', parseInt(data.CutID))
      formData.append('LabID', parseInt(data.LabID))
      formData.append('PolishID', parseInt(data.PolishID))
      formData.append('SymmetryID', parseInt(data.SymmetryID))
      formData.append('LocationID', parseInt(data.LocationID))
      formData.append('CertificateNumber', data.CertificateNumber)

      // Handle image uploads (similar to onAddSubmit)
      const imageFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
      for (let i = 0; i < imageFields.length; i++) {
        const imageField = imageFields[i]
        const fileReaderRef = fileReaderRefs[i] // Get the ref for this image

        if (data[imageField] && data[imageField][0]) {
          const file = data[imageField][0]
          if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            alert('Only JPG, PNG, and GIF files are allowed.')
            return
          }
          if (file.size > 1 * 1024 * 1024) {
            // 1MB
            alert('File size should not exceed 1MB.')
            return
          }

          fileReaderRef.current = new FileReader()
          fileReaderRef.current.readAsDataURL(file)

          await new Promise(resolve => {
            fileReaderRef.current.onloadend = () => {
              const base64data = fileReaderRef.current.result
              const imageData = {
                fileName: `${Date.now()}-${file.name}`,
                mimeType: file.type,
                base64: base64data
              }
              formData.append(imageField, JSON.stringify(imageData))
              resolve()
            }
          })
        }
      }

      formData.append('ModifiedBy', 1) // Replace with the actual user ID

      const response = await axios.put('/api/filters/solitaires', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.statusid === 1) {
        fetchSolitaires() // Update the UI after successful editing
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
      console.error('Error updating solitaire:', error)
      setError('Error updating solitaire')
      setToastSeverity('error')
      setToastMessage('Error updating solitaire. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (solitaireId, newIsActive) => {
    try {
      const response = await axios.put('/api/filters/solitaires-active', {
        solitaireId,
        isActive: newIsActive
      })

      if (response.data.statusid === 1) {
        // Update the solitaires data in the UI
        setSolitaires(prevSolitaires =>
          prevSolitaires.map(solitaire =>
            solitaire.SolitaireID === solitaireId ? { ...solitaire, IsActive: newIsActive } : solitaire
          )
        )
        setToastSeverity('success')
        setToastMessage('Solitaire active status updated successfully!')
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
      setToastMessage('Error updating solitaire active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Solitaires Data (Using Dummy Data)
  const fetchSolitaires = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/solitaires')
      console.log('fetch solitaires response:', response)
      if (response.data.statusid === 1) {
        setSolitaires(response.data.solitaires)
        setToastSeverity('success')
        setToastMessage('Solitaires fetched successfully.')
        setToastOpen(true)
      } else {
        setError(response.data.statusmessage)
        setToastSeverity('error')
        setToastMessage(response.data.statusmessage)
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error fetching solitaires:', error)
      setError('Error fetching solitaires')
      setToastSeverity('error')
      setToastMessage('Error fetching solitaires. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllFilterData() // Fetch all filter data when the component mounts
    fetchSolitaires()
    // console.log('shapes state: ', shapes)
  }, [])

  //   useEffect(() => {
  //     console.log('symmetry state: ', symms)
  //   }, [symms])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  // Handle Edit Solitaire
  const handleEdit = solitaire => {
    setSolitaireToEdit(solitaire)
    // console.log('to edit the solitaire :', solitaire)
    // console.log('solitaire.ShapeID:', solitaire.ShapeID)
    const shapeId = shapes.find(shape => shape.ShapeName === solitaire.ShapeName)?.ShapeID || ''
    const colorId = colors.find(color => color.ColorName === solitaire.ColorName)?.ColorID || ''
    const fluorId = flours.find(fluor => fluor.FluorName === solitaire.FluorName)?.FluorID || ''
    const purityId = purities.find(purity => purity.PurityName === solitaire.PurityName)?.PurityID || ''
    const cutId = cuts.find(cut => cut.CutName === solitaire.CutName)?.CutID || ''
    const labId = labs.find(lab => lab.LabName === solitaire.LabName)?.LabID || ''
    const polishId = polishs.find(polish => polish.PolishName === solitaire.PolishName)?.PolishID || ''
    const symmetryId = symms.find(symm => symm.SymmetryName === solitaire.SymmetryName)?.SymmetryID || 'emptystring'
    // console.log(symms[1].SymmetryName, 'name in symms')
    // console.log(solitaire.SymmName)
    // console.log('matched symmetryId in handletoEdit:', symmetryId)
    const locationId = locations.find(location => location.LocationName === solitaire.LocationName)?.LocationID || '' // console.log('shapeIdmatch:', shapeId)
    // const selectedShape = shapes.find(shape => shape.ShapeID === solitaire.ShapeID)
    resetEditForm({
      SolitaireID: solitaire.SolitaireID,
      ShapeID: shapeId?.toString() || '',
      Carat: solitaire.Carat,
      ColorID: colorId.toString() || '',
      FluorID: fluorId.toString() || '',
      PurityID: purityId.toString() || '',
      CutID: cutId.toString() || '',
      LabID: labId.toString() || '',
      PolishID: polishId.toString() || '',
      SymmetryID: symmetryId.toString() || '',
      LocationID: locationId.toString() || '',
      CertificateNumber: solitaire.CertificateNumber,
      Image1: solitaire.Image1,
      Image2: null,
      Image3: null,
      Image4: null,
      Image5: null
    })
    setEditModalOpen(true)
  }

  // Handle Delete Solitaire
  const handleDelete = solitaireId => {
    setSolitaireToDelete(solitaireId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (solitaireToDelete) {
        const response = await axios.delete(`/api/filters/solitaires?solitaireId=${solitaireToDelete}`)

        if (response.data.statusid === 1) {
          fetchSolitaires() // Update the UI after successful deletion
          setSolitaireToDelete(null)
          setToastSeverity('success')
          setToastMessage('Solitaire deleted successfully!')
          setToastOpen(true)
        } else {
          setError(response.data.statusmessage)
          setToastSeverity('error')
          setToastMessage(response.data.statusmessage)
          setToastOpen(true)
        }
      }
    } catch (error) {
      console.error('Error deleting solitaire:', error)
      setError('Error deleting solitaire')
      setToastSeverity('error')
      setToastMessage('Error deleting solitaire. Please try again later.')
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
      // CertificateNumber column
      columnHelper.accessor('CertificateNumber', {
        header: 'Certificate Number',
        cell: info => info.getValue(),
        sortType: 'basic' // Enable sorting
      }),

      // UniqueCode column
      columnHelper.accessor('UniqueCode', {
        header: 'Unique Code',
        cell: info => info.getValue(),
        sortType: 'basic' // Enable sorting
      }),
      columnHelper.accessor('ShapeName', {
        // Using accessor for ShapeName
        header: 'Shape',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Carat', {
        header: 'Carat',
        cell: info => info.getValue(),
        sortType: 'basic' // Enable sorting for Carat
      }),
      columnHelper.accessor('ColorName', {
        // Using accessor for ColorName
        header: 'Color',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('FluorName', {
        // Using accessor for FluorName
        header: 'Fluor',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('PurityName', {
        // Using accessor for PurityName
        header: 'Purity',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('CutName', {
        // Using accessor for CutName
        header: 'Cut',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('LabName', {
        // Using accessor for LabName
        header: 'Lab',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('PolishName', {
        // Using accessor for PolishName
        header: 'Polish',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('SymmetryName', {
        // Using accessor for SymmetryName
        header: 'Symm',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('LocationName', {
        // Using accessor for LocationName
        header: 'Location',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.SolitaireID, e.target.checked)}
              />
            }
            label=''
          />
        )
      }),
      // Image columns
      columnHelper.accessor('Image1', {
        header: 'Image 1',
        cell: info => {
          if (info.getValue()) {
            return (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image src={info.getValue()} alt='Image' width={30} height={30} className='block max-w-full h-auto' />
              </div>
            )
          }
          return <Typography variant='body2'>No Image</Typography>
        }
      }),
      columnHelper.accessor('Image2', {
        header: 'Image 2',
        cell: info => {
          if (info.getValue()) {
            return (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image src={info.getValue()} alt='Image' width={30} height={30} className='block max-w-full h-auto' />
              </div>
            )
          }
          return <Typography variant='body2'>No Image</Typography>
        }
      }),
      columnHelper.accessor('Image3', {
        header: 'Image 3',
        cell: info => {
          if (info.getValue()) {
            return (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image src={info.getValue()} alt='Image' width={30} height={30} className='block max-w-full h-auto' />
              </div>
            )
          }
          return <Typography variant='body2'>No Image</Typography>
        }
      }),
      columnHelper.accessor('Image4', {
        header: 'Image 4',
        cell: info => {
          if (info.getValue()) {
            return (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image src={info.getValue()} alt='Image' width={30} height={30} className='block max-w-full h-auto' />
              </div>
            )
          }
          return <Typography variant='body2'>No Image</Typography>
        }
      }),
      columnHelper.accessor('Image5', {
        header: 'Image 5',
        cell: info => {
          if (info.getValue()) {
            return (
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image src={info.getValue()} alt='Image' width={30} height={30} className='block max-w-full h-auto' />
              </div>
            )
          }
          return <Typography variant='body2'>No Image</Typography>
        }
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
            {isDeleting && solitaireToDelete === row.original.SolitaireID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.SolitaireID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [
      isDeleting,
      solitaireToDelete,
      // shapes, carats, colors, flours, purities, cuts, labs, polishs, symms,
      locations
    ]
  )

  // Three dots button state
  const [anchorEl, setAnchorEl] = useState(null)

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
    data: solitaires,
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

  // Close Drawer (Add Solitaire)
  const handleClose = () => {
    setAddSolitaireOpen(false)
    resetAddForm()
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
          <DialogContentText>Are you sure you want to delete this solitaire?</DialogContentText>
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

      {/* Add Solitaire Drawer */}
      <Drawer
        open={addSolitaireOpen}
        anchor='right'
        variant='temporary'
        onClose={handleClose}
        sx={{ width: '400px' }}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              lg: '60%'
            }
          }
        }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Add New Solitaire</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* ShapeID Controller */}
              <Controller
                name='ShapeID'
                control={control}
                render={({ field }) => {
                  const options = shapes.map(shape => ({
                    value: shape.ShapeID.toString(),
                    label: shape.ShapeName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Shape'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            // Hover styles for options
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* Carat Controller */}
              <Controller
                name='Carat'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Carat Value'
                    placeholder='Enter Carat'
                    error={!!addErrors.Carat}
                    helperText={addErrors.Carat ? 'This field is required' : ''}
                    type='number'
                    InputProps={{
                      inputProps: {
                        style: { padding: '8px 2px' } // Reduced padding
                      },
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }}
                  />
                )}
              />

              {/* PolishID Controller (Moved to the first grid) */}
              <Controller
                name='PolishID'
                control={control}
                render={({ field }) => {
                  const options = polishs.map(polish => ({
                    value: polish.PolishID.toString(),
                    label: polish.PolishName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Polish'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* ColorID Controller */}
              <Controller
                name='ColorID'
                control={control}
                render={({ field }) => {
                  const options = colors.map(color => ({
                    value: color.ColorID.toString(),
                    label: color.ColorName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Color'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* FluorID Controller */}
              <Controller
                name='FluorID'
                control={control}
                render={({ field }) => {
                  const options = flours.map(fluor => ({
                    value: fluor.FluorID.toString(),
                    label: fluor.FluorName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Fluor'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* PurityID Controller */}
              <Controller
                name='PurityID'
                control={control}
                render={({ field }) => {
                  const options = purities.map(purity => ({
                    value: purity.PurityID.toString(),
                    label: purity.PurityName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Purity'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />
              {/* CutID Controller */}
              <Controller
                name='CutID'
                control={control}
                render={({ field }) => {
                  const options = cuts.map(cut => ({
                    value: cut.CutID.toString(),
                    label: cut.CutName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Cut'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* LabID Controller */}
              <Controller
                name='LabID'
                control={control}
                render={({ field }) => {
                  const options = labs.map(lab => ({
                    value: lab.LabID.toString(),
                    label: lab.LabName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Lab'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* SymmetryID Controller */}
              <Controller
                name='SymmetryID'
                control={control}
                render={({ field }) => {
                  const options = symms.map(symm => ({
                    value: symm.SymmetryID.toString(),
                    label: symm.SymmetryName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Symmetry'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* LocationID Controller */}
              <Controller
                name='LocationID'
                control={control}
                render={({ field }) => {
                  const options = locations.map(location => ({
                    value: location.LocationID.toString(),
                    label: location.LocationName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Location'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />
              {/* CertificateNumber Controller */}
              <Controller
                name='CertificateNumber'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Certificate Number'
                    placeholder='Enter Certificate Number'
                    error={!!addErrors.CertificateNumber}
                    InputProps={{
                      inputProps: {
                        style: { padding: '12px 15px' } // Reduced padding
                      }
                    }}
                    helperText={addErrors.CertificateNumber ? 'This field is required' : ''}
                  />
                )}
              />
              {/* Image Upload Fields */}
              <Controller
                name='Image1'
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 1 (Optional)
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
                  </Stack>
                )}
              />

              <Controller
                name='Image2'
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 2 (Optional)
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
                  </Stack>
                )}
              />
              <Controller
                name='Image3'
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 3 (Optional)
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
                  </Stack>
                )}
              />
              <Controller
                name='Image4'
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 4 (Optional)
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
                  </Stack>
                )}
              />
              <Controller
                name='Image5'
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 5 (Optional)
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
                  </Stack>
                )}
              />
            </div>

            {/* Submit Buttons */}
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

      {/* Edit Solitaire Drawer */}

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
            Edit Solitaire
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* ShapeID Controller */}
              <Controller
                name='ShapeID'
                control={editControl}
                render={({ field }) => {
                  const options = shapes.map(shape => ({
                    value: shape.ShapeID.toString(),
                    label: shape.ShapeName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Shape'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* Carat Controller */}
              <Controller
                name='Carat'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Carat'
                    placeholder='Enter Carat'
                    error={!!editErrors.Carat}
                    helperText={editErrors.Carat ? 'This field is required' : ''}
                    type='number'
                    InputProps={{
                      inputProps: {
                        style: { padding: '7px 8px' } // Reduced padding
                      },
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }}
                    value={field.value.toString()} // Display existing Carat value
                  />
                )}
              />

              {/* PolishID Controller */}
              <Controller
                name='PolishID'
                control={editControl}
                render={({ field }) => {
                  const options = polishs.map(polish => ({
                    value: polish.PolishID.toString(),
                    label: polish.PolishName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Polish'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* ColorID Controller */}
              <Controller
                name='ColorID'
                control={editControl}
                render={({ field }) => {
                  const options = colors.map(color => ({
                    value: color.ColorID.toString(),
                    label: color.ColorName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Color'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* FluorID Controller */}
              <Controller
                name='FluorID'
                control={editControl}
                render={({ field }) => {
                  const options = flours.map(fluor => ({
                    value: fluor.FluorID.toString(),
                    label: fluor.FluorName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Fluor'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* PurityID Controller */}
              <Controller
                name='PurityID'
                control={editControl}
                render={({ field }) => {
                  const options = purities.map(purity => ({
                    value: purity.PurityID.toString(),
                    label: purity.PurityName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Purity'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* CutID Controller */}
              <Controller
                name='CutID'
                control={editControl}
                render={({ field }) => {
                  const options = cuts.map(cut => ({
                    value: cut.CutID.toString(),
                    label: cut.CutName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Cut'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* LabID Controller */}
              <Controller
                name='LabID'
                control={editControl}
                render={({ field }) => {
                  const options = labs.map(lab => ({
                    value: lab.LabID.toString(),
                    label: lab.LabName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Lab'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* SymmetryID Controller */}
              <Controller
                name='SymmetryID'
                control={editControl}
                render={({ field }) => {
                  const options = symms.map(symm => ({
                    value: symm.SymmetryID.toString(),
                    label: symm.SymmetryName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Symmetry'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />

              {/* LocationID Controller */}
              <Controller
                name='LocationID'
                control={editControl}
                render={({ field }) => {
                  const options = locations.map(location => ({
                    value: location.LocationID.toString(),
                    label: location.LocationName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Location'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
                          color: theme.palette.mode === 'dark' ? '#eee9ef' : '#444',
                          borderColor: state.isFocused
                            ? 'var(--mui-palette-primary-main)'
                            : 'var(--mui-palette-divider)'
                        }),
                        menu: provided => ({
                          ...provided,
                          backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
                          zIndex: 9999
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? theme.palette.mode === 'dark'
                              ? '#1c1e33'
                              : 'rgba(0, 0, 0, 0.08)'
                            : provided.backgroundColor,
                          color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? '#3a3e5b' // Darker background on hover in dark mode
                                : 'rgba(0, 0, 0, 0.04)'
                          }
                        })
                      }}
                    />
                  )
                }}
              />
              {/* CertificateNumber Controller */}
              <Controller
                name='CertificateNumber'
                control={editControl}
                rules={{ required: true }}
                // defaultValue={solitaireToEdit?.CertificateNumber}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Certificate Number'
                    placeholder='Enter Certificate Number'
                    error={!!editErrors.CertificateNumber}
                    helperText={editErrors.CertificateNumber ? 'This field is required' : ''}
                    value={field.value} // Display existing Certificate Number
                  />
                )}
              />
              {/* Image Upload Fields */}
              <Controller
                name='Image1'
                control={editControl}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 1 (Optional)
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
                      {/* Check the type of field.value */}
                      {field.value ? (
                        field.value[0] instanceof File ? (
                          <Image
                            src={URL.createObjectURL(field.value[0])}
                            alt='Selected Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        ) : (
                          <Image
                            src={solitaireToEdit.Image1}
                            alt='Solitaire Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        )
                      ) : solitaireToEdit?.Image1 ? (
                        <Image
                          src={solitaireToEdit.Image1}
                          alt='Solitaire Image'
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
                  </Stack>
                )}
              />

              <Controller
                name='Image2'
                control={editControl}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 2 (Optional)
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
                      {/* Check the type of field.value */}
                      {field.value ? (
                        field.value[0] instanceof File ? (
                          <Image
                            src={URL.createObjectURL(field.value[0])}
                            alt='Selected Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        ) : (
                          <Image
                            src={solitaireToEdit.Image1}
                            alt='Solitaire Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        )
                      ) : solitaireToEdit?.Image1 ? (
                        <Image
                          src={solitaireToEdit.Image1}
                          alt='Solitaire Image'
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
                  </Stack>
                )}
              />
              <Controller
                name='Image3'
                control={editControl}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 3 (Optional)
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
                      {/* Check the type of field.value */}
                      {field.value ? (
                        field.value[0] instanceof File ? (
                          <Image
                            src={URL.createObjectURL(field.value[0])}
                            alt='Selected Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        ) : (
                          <Image
                            src={solitaireToEdit.Image1}
                            alt='Solitaire Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        )
                      ) : solitaireToEdit?.Image1 ? (
                        <Image
                          src={solitaireToEdit.Image1}
                          alt='Solitaire Image'
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
                  </Stack>
                )}
              />
              <Controller
                name='Image4'
                control={editControl}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 4 (Optional)
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
                      {/* Check the type of field.value */}
                      {field.value ? (
                        field.value[0] instanceof File ? (
                          <Image
                            src={URL.createObjectURL(field.value[0])}
                            alt='Selected Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        ) : (
                          <Image
                            src={solitaireToEdit.Image1}
                            alt='Solitaire Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        )
                      ) : solitaireToEdit?.Image1 ? (
                        <Image
                          src={solitaireToEdit.Image1}
                          alt='Solitaire Image'
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
                  </Stack>
                )}
              />
              <Controller
                name='Image5'
                control={editControl}
                rules={{ required: false }}
                render={({ field }) => (
                  <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                      Upload Image 5 (Optional)
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
                      {/* Check the type of field.value */}
                      {field.value ? (
                        field.value[0] instanceof File ? (
                          <Image
                            src={URL.createObjectURL(field.value[0])}
                            alt='Selected Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        ) : (
                          <Image
                            src={solitaireToEdit.Image1}
                            alt='Solitaire Image'
                            width={150}
                            height={150}
                            className='rounded-md shadow-md'
                          />
                        )
                      ) : solitaireToEdit?.Image1 ? (
                        <Image
                          src={solitaireToEdit.Image1}
                          alt='Solitaire Image'
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
                  </Stack>
                )}
              />
            </div>

            {/* Submit Buttons */}
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
        Solitaire Form
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
            placeholder='Search Solitaire'
            inputRef={searchInputRef}
            className='is-full sm:is-auto'
          /> */}
          <Button
            variant='contained'
            onClick={() => setAddSolitaireOpen(!addSolitaireOpen)}
            className='is-full sm:is-auto'
            disabled={isFilterDataLoading} // Disable Add button while loading
          >
            {isFilterDataLoading ? 'Loading...' : 'Add New Solitaire'}
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
                        onClick={header.column.getToggleSortingHandler()} // onClick for sorting
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

export default SolitaireFilterPage
