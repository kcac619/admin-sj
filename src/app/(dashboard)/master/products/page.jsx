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
import { Controller, useForm } from 'react-hook-form'
import { DialogContentText, MenuItem } from '@mui/material'

// Define column helper
const columnHelper = createColumnHelper()

// Alert Component
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

const ProductFilterPage = () => {
  const theme = useTheme()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const primaryColor = primaryColorConfig.find(color => color.name === 'primary-1')

  const [globalFilter, setGlobalFilter] = useState('')
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState(null)
  const searchInputRef = useRef(null)

  const [productToDelete, setProductToDelete] = useState(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

  const [sorting, setSorting] = useState([['ProductID', 'asc']]) // Default sorting

  // Loading States
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastSeverity, setToastSeverity] = useState('success') // 'success' | 'error'
  const [toastMessage, setToastMessage] = useState('')

  // Filter Data (Initially Empty - will be fetched)
  const [categories, setCategories] = useState([])

  // useForm for Add Product
  const {
    control,
    reset: resetAddForm,
    handleSubmit: handleAddSubmit,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      CategoryID: '',
      Title: '',
      Description: '',
      Price: '',
      PreviousPrice: '',
      Stock: '',
      Sizes: '',
      FeatureImage: null, // For file input
      Policy: '',
      Tags: '',
      Featured: '',
      Approved: 'yes', // Default value
      Status: 1, // Default value
      Slug: '',
      ShortDescription: '',
      SKU: '',
      Image1: null,
      Image2: null,
      Image3: null,
      Image4: null,
      Image5: null,
      Color: '',
      Video: null, // You'll implement video upload later
      Attribute: '',
      VendorID: '',
      Owner: 'admin' // Default value
    }
  })

  // useForm for Edit Product
  const {
    control: editControl,
    reset: resetEditForm,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors }
  } = useForm({
    defaultValues: {
      ProductID: '',
      CategoryID: '',
      Title: '',
      Description: '',
      Price: '',
      PreviousPrice: '',
      Stock: '',
      Sizes: '',
      FeatureImage: null, // For file input
      Policy: '',
      Tags: '',
      Featured: '',
      Approved: 'yes', // Default value
      Status: 1, // Default value
      Slug: '',
      ShortDescription: '',
      SKU: '',
      Image1: null,
      Image2: null,
      Image3: null,
      Image4: null,
      Image5: null,
      Color: '',
      Video: null, // You'll implement video upload later
      Attribute: '',
      VendorID: '',
      Owner: 'admin' // Default value
    }
  })

  // FileReader refs (declared outside the component)
  const imageFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
  const fileReaderRefs = imageFields.map(() => useRef(null))

  // Fetch Data for All Filters
  const fetchAllFilterData = async () => {
    setIsFilterDataLoading(true)
    try {
      const categoriesResponse = await axios.get('/api/filters/categories')

      if (categoriesResponse.data.categories) {
        setCategories(categoriesResponse.data.categories.filter(category => !category.IsDeleted))
      } else {
        console.error('Error fetching categories:', categoriesResponse)
        setToastSeverity('error')
        setToastMessage('Error fetching categories. Please try again later.')
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

  // Handle Add Product Form Submission
  const onAddSubmit = async data => {
    setIsAdding(true)
    try {
      const formData = new FormData()
      formData.append('CategoryID', parseInt(data.CategoryID))
      formData.append('Title', data.Title)
      formData.append('Description', data.Description)
      formData.append('Price', parseFloat(data.Price))
      formData.append('PreviousPrice', parseFloat(data.PreviousPrice))
      formData.append('Stock', parseInt(data.Stock))
      formData.append('Sizes', data.Sizes)
      // formData.append('FeatureImage', data.FeatureImage)
      formData.append('Policy', data.Policy)
      formData.append('Tags', data.Tags)
      formData.append('Featured', parseInt(data.Featured))
      formData.append('Approved', data.Approved)
      formData.append('Status', parseInt(data.Status))
      formData.append('Slug', data.Slug)
      formData.append('ShortDescription', data.ShortDescription)
      formData.append('SKU', data.SKU)
      formData.append('Color', data.Color)
      formData.append('Video', data.Video)
      formData.append('Attribute', data.Attribute)
      formData.append('VendorID', parseInt(data.VendorID))
      formData.append('Owner', data.Owner)

      const imageFields = ['Image1', 'Image2', 'Image3', 'Image4', 'Image5']
      for (let i = 0; i < imageFields.length; i++) {
        const imageField = imageFields[i]
        const fileReaderRef = fileReaderRefs[i] // Get the ref for this image

        if (data[imageField] && data[imageField][0]) {
          // console.log('data[imageField][0]:', data[imageField][0])
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

      const response = await axios.post('/api/filters/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      })

      if (response.data.statusid === 1) {
        fetchProducts() // Update the UI after successful addition
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
      console.error('Error creating product:', error)
      setError('Error creating product')
      setToastSeverity('error')
      setToastMessage('Error creating product. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Edit Product Form Submission
  const onEditSubmit = async data => {
    setIsEditing(true)
    try {
      const formData = new FormData()

      formData.append('ProductID', parseInt(data.ProductID))
      formData.append('CategoryID', parseInt(data.CategoryID))
      formData.append('Title', data.Title)
      formData.append('Description', data.Description)
      formData.append('Price', parseFloat(data.Price))
      formData.append('PreviousPrice', parseFloat(data.PreviousPrice))
      formData.append('Stock', parseInt(data.Stock))
      formData.append('Sizes', data.Sizes)
      // formData.append('FeatureImage', data.FeatureImage)
      formData.append('Policy', data.Policy)
      formData.append('Tags', data.Tags)
      formData.append('Featured', parseInt(data.Featured))
      formData.append('Approved', data.Approved)
      formData.append('Status', parseInt(data.Status))
      formData.append('Slug', data.Slug)
      formData.append('ShortDescription', data.ShortDescription)
      formData.append('SKU', data.SKU)
      formData.append('Color', data.Color)
      formData.append('Video', data.Video)
      formData.append('Attribute', data.Attribute)
      formData.append('VendorID', parseInt(data.VendorID))
      formData.append('Owner', data.Owner)

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

      const response = await axios.put('/api/filters/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      })

      if (response.data.statusid === 1) {
        fetchProducts() // Update the UI after successful editing
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
      console.error('Error updating product:', error)
      setError('Error updating product')
      setToastSeverity('error')
      setToastMessage('Error updating product. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle IsActive Toggle
  const handleIsActiveToggle = async (productId, newIsActive) => {
    try {
      const response = await axios.put('/api/filters/products-active', {
        productId,
        isActive: newIsActive
      })

      if (response.data.statusid === 1) {
        // Update the products data in the UI
        setProducts(prevProducts =>
          prevProducts.map(product =>
            product.ProductID === productId ? { ...product, IsActive: newIsActive } : product
          )
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
      setToastMessage('Error updating product active status. Please try again.')
      setToastOpen(true)
    }
  }

  // Fetch Products Data
  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/filters/products', {
        headers: {
          Accept: 'application/json'
        }
      })

      console.log('Products Response Data:', response.data)

      if (response.data.products) {
        setProducts(response.data.products)
        setFilteredProducts(response.data.products)
      } else {
        setError('Products data not found')
        setToastSeverity('error')
        setToastMessage('Products data not found.')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Error fetching products')
      setToastSeverity('error')
      setToastMessage('Error fetching products. Please try again later.')
      setToastOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllFilterData()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [globalFilter])

  //   useEffect(() => {
  //     const filteredData = products.filter(
  //       product => product?.Title.toLowerCase().includes(globalFilter.toLowerCase()) && !product?.IsDeleted
  //     )
  //     setFilteredProducts(filteredData)
  //   }, [globalFilter, products])

  // Handle Edit Product
  // Function to convert a URL to a File/Blob
  const urlToFile = async (url, filename) => {
    // Base64 encode the URL
    const encodedUrl = btoa(url)

    try {
      const response = await fetch(`/api/filters/fetch-image?url=${encodedUrl}`)
      console.log('response:', response)
      const blob = await response.blob()
      const mimeType = response.headers.get('Content-Type') // Get MIME type from headers
      return new File([blob], filename, { type: mimeType })
    } catch (error) {
      console.error(`Error converting URL to File:`, error)
      return null
    }
  }
  const handleEdit = async product => {
    try {
      setProductToEdit(product)
      const image1File = product.Image1 ? await urlToFile(product.Image1, 'image1.jpg') : null
      const image2File = product.Image2 ? await urlToFile(product.Image2, 'image2.jpg') : null
      const image3File = product.Image3 ? await urlToFile(product.Image3, 'image3.jpg') : null
      const image4File = product.Image4 ? await urlToFile(product.Image4, 'image4.jpg') : null
      const image5File = product.Image5 ? await urlToFile(product.Image5, 'image5.jpg') : null

      // Set default values for the edit form
      resetEditForm({
        ProductID: product.ProductID,
        CategoryID: product.CategoryID?.toString(),
        Title: product.Title,
        Description: product.Description,
        Price: product.Price,
        PreviousPrice: product.PreviousPrice,
        Stock: product.Stock,
        Sizes: product.Sizes,
        FeatureImage: product.FeatureImage, // Assuming you are sending image URLs
        Policy: product.Policy,
        Tags: product.Tags,
        Featured: product.Featured,
        Approved: product.Approved,
        Status: product.Status,
        Slug: product.Slug,
        ShortDescription: product.ShortDescription,
        SKU: product.SKU,
        Image1: image1File ? [image1File] : null, // Set as an array if file exists
        Image2: image2File ? [image2File] : null,
        Image3: image3File ? [image3File] : null,
        Image4: image4File ? [image4File] : null,
        Image5: image5File ? [image5File] : null,
        Color: product.Color,
        Video: product.Video, // Set the video URL
        Attribute: product.Attribute,
        VendorID: product.VendorID,
        Owner: product.Owner
      })
    } catch (error) {
      console.error('Error in handleEdit:', error)
      // Handle the error appropriately (e.g., display an error toast)
      setToastSeverity('error')
      setToastMessage('Error fetching image data. Please try again later.')
      setToastOpen(true)
    }
    setEditModalOpen(true)
  }

  // Handle Delete product
  const handleDelete = productId => {
    setProductToDelete(productId)
    setDeleteConfirmationOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (productToDelete) {
        const response = await axios.delete(`/api/filters/products?productId=${productToDelete}`)
        console.log(response.data.message)
        fetchProducts()
        setProductToDelete(null)
        setToastSeverity('success')
        setToastMessage('Product deleted successfully!')
        setToastOpen(true)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setError(error.message)
      setToastSeverity('error')
      setToastMessage('Error deleting product. Please try again later.')
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
      columnHelper.accessor('CategoryName', {
        header: 'Category',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Description', {
        header: 'Description',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Price', {
        header: 'Price',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('PreviousPrice', {
        header: 'Previous Price',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Stock', {
        header: 'Stock',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Sizes', {
        header: 'Sizes',
        cell: info => info.getValue()
      }),
      // columnHelper.accessor('FeatureImage', {
      //   header: 'FeatureImage',
      //   cell: info => info.getValue()
      // }),
      columnHelper.accessor('Policy', {
        header: 'Policy',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Tags', {
        header: 'Tags',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Featured', {
        header: 'Featured',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Views', {
        header: 'Views',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Approved', {
        header: 'Approved',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('CreatedAt', {
        header: 'Created At',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('UpdatedAt', {
        header: 'Updated At',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Status', {
        header: 'Status',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Slug', {
        header: 'Slug',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('ShortDescription', {
        header: 'Short Description',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('SKU', {
        header: 'SKU',
        cell: info => info.getValue()
      }),
      columnHelper.display({
        id: 'image1',
        header: 'Image1',
        cell: ({ row }) => (
          <div>
            {row.original.Image1 ? ( // Check if Image1 URL exists
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.Image1} // Display Image1
                  alt={row.original.Title}
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
        id: 'image2',
        header: 'Image2',
        cell: ({ row }) => (
          <div>
            {row.original.Image2 ? ( // Check if Image1 URL exists
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.Image2} // Display Image1
                  alt={row.original.Title}
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
        id: 'image3',
        header: 'Image3',
        cell: ({ row }) => (
          <div>
            {row.original.Image3 ? ( // Check if Image1 URL exists
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.Image3} // Display Image1
                  alt={row.original.Title}
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
        id: 'image4',
        header: 'Image4',
        cell: ({ row }) => (
          <div>
            {row.original.Image4 ? ( // Check if Image1 URL exists
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.Image4} // Display Image1
                  alt={row.original.Title}
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
        id: 'image5',
        header: 'Image5',
        cell: ({ row }) => (
          <div>
            {row.original.Image5 ? ( // Check if Image1 URL exists
              <div className='bg-white inline-block p-1 mt-1 shadow-md'>
                <Image
                  src={row.original.Image5} // Display Image1
                  alt={row.original.Title}
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
      columnHelper.accessor('Color', {
        header: 'Color',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Video', {
        header: 'Video',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Attribute', {
        header: 'Attribute',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('VendorID', {
        header: 'VendorID',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('Owner', {
        header: 'Owner',
        cell: info => info.getValue()
      }),
      columnHelper.accessor('IsActive', {
        header: 'Is Active',
        cell: ({ row }) => (
          <FormControlLabel
            control={
              <Switch
                checked={row.original.IsActive}
                onChange={e => handleIsActiveToggle(row.original.ProductID, e.target.checked)}
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
            {isDeleting && productToDelete === row.original.ProductID ? (
              <CircularProgress size={20} />
            ) : (
              <IconButton onClick={() => handleDelete(row.original.ProductID)} color='error'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )}
          </div>
        )
      })
    ],
    [isDeleting, productToDelete] // Add isDeleting and shapeToDelete to dependencies
  )

  // React Table Instance
  const table = useReactTable({
    data: products,
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
    setAddProductOpen(false)
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
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : '#fff', // White background in light mode
      color: theme.palette.mode === 'dark' ? '#fff' : '#444',
      borderColor: state.isFocused ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-divider)'
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: theme.palette.mode === 'dark' ? '#fff' : '#000'
    }),
    menu: provided => ({
      ...provided,
      backgroundColor: theme.palette.mode === 'dark' ? '#282a42' : '#fff',
      zIndex: 9999,
      '::-webkit-scrollbar': {
        width: '8px'
      },
      '::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
        borderRadius: '4px'
      },
      '::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? '#777' : '#aaa'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor:
        state.isFocused || state.isSelected
          ? theme.palette.mode === 'dark'
            ? '#1c1e33'
            : 'rgba(0, 0, 0, 0.08)'
          : provided.backgroundColor,
      color: state.isSelected ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : provided.color,
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? '#3a3e5b' : 'rgba(0, 0, 0, 0.04)'
      }
    })
  }

  return (
    <div className='mt-0 pt-0'>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmationOpen} onClose={() => setDeleteConfirmationOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this product?</DialogContentText>
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
      {/* Add Product Drawer */}
      <Drawer
        open={addProductOpen}
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
          <Typography variant='h5'>Add New Product</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {' '}
              {/* 2 columns layout */}
              <Controller
                name='CategoryID'
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const options = categories.map(category => ({
                    value: category.CategoryID.toString(),
                    label: category.CategoryName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Category'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value)}
                      styles={selectStyles} // Apply the selectStyles
                    />
                  )
                }}
              />
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
                name='Price'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Price'
                    placeholder='Enter Price'
                    error={!!addErrors.Price}
                    helperText={addErrors.Price ? 'This field is required' : ''}
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
              <Controller
                name='PreviousPrice'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Previous Price'
                    placeholder='Enter Previous Price'
                    error={!!addErrors.PreviousPrice}
                    helperText={addErrors.PreviousPrice ? 'This field is required' : ''}
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
              <Controller
                name='Stock'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Stock'
                    placeholder='Enter Stock'
                    error={!!addErrors.Stock}
                    helperText={addErrors.Stock ? 'This field is required' : ''}
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
              <Controller
                name='Sizes'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Sizes'
                    placeholder='Enter Sizes'
                    error={!!addErrors.Sizes}
                    helperText={addErrors.Sizes ? 'This field is required' : ''}
                  />
                )}
              />
              {/* <Controller
                name='FeatureImage'
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                    <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                        Upload Feature Image (Optional)
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
                    {isAdding && <CircularProgress size={24} className='ms-3' />}
                    </Stack>
                )}
                /> */}
              <Controller
                name='Policy'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Policy'
                    placeholder='Enter Policy'
                    error={!!addErrors.Policy}
                    helperText={addErrors.Policy ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Tags'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Tags'
                    placeholder='Enter Tags'
                    error={!!addErrors.Tags}
                    helperText={addErrors.Tags ? 'This field is required' : ''}
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
                name='Approved'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Approved'
                    placeholder='Enter Approved'
                    error={!!addErrors.Approved}
                    helperText={addErrors.Approved ? 'This field is required' : ''}
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
                name='Slug'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Slug'
                    placeholder='Enter Slug'
                    error={!!addErrors.Slug}
                    helperText={addErrors.Slug ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='ShortDescription'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='ShortDescription'
                    placeholder='Enter ShortDescription'
                    error={!!addErrors.ShortDescription}
                    helperText={addErrors.ShortDescription ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='SKU'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='SKU'
                    placeholder='Enter SKU'
                    error={!!addErrors.SKU}
                    helperText={addErrors.SKU ? 'This field is required' : ''}
                  />
                )}
              />
              {/* Add image upload fields */}
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
              <Controller
                name='Color'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Color'
                    placeholder='Enter Color'
                    error={!!addErrors.Color}
                    helperText={addErrors.Color ? 'This field is required' : ''}
                  />
                )}
              />
              {/* <Controller
                name='Video'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                    <TextField
                    {...field}
                    fullWidth
                    label='Video'
                    placeholder='Enter Video'
                    error={!!addErrors.Video}
                    helperText={addErrors.Video ? 'This field is required' : ''}
                    />
                )}
                /> */}
              <Controller
                name='Attribute'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Attribute'
                    placeholder='Enter Attribute'
                    error={!!addErrors.Attribute}
                    helperText={addErrors.Attribute ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='VendorID'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='VendorID'
                    placeholder='Enter VendorID'
                    error={!!addErrors.VendorID}
                    helperText={addErrors.VendorID ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Owner'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Owner'
                    placeholder='Enter Owner'
                    error={!!addErrors.Owner}
                    helperText={addErrors.Owner ? 'This field is required' : ''}
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
            </div>
          </form>
        </div>
      </Drawer>

      {/* Edit Product Drawer (Previously a Dialog) */}
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
            Edit Product
          </Typography>
          <IconButton size='small' onClick={() => setEditModalOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {' '}
              {/* 2 columns layout */}
              <Controller
                name='ProductID'
                control={editControl}
                render={({ field }) => <TextField {...field} margin='dense' label='Product ID' fullWidth disabled />}
              />
              <Controller
                name='CategoryID'
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const options = categories.map(category => ({
                    value: category.CategoryID.toString(),
                    label: category.CategoryName
                  }))

                  return (
                    <Select
                      {...field}
                      options={options}
                      placeholder='Select Category'
                      isSearchable
                      onChange={selectedOption => {
                        field.onChange(selectedOption ? selectedOption.value : '')
                      }}
                      value={options.find(option => option.value === field.value?.toString())}
                      styles={selectStyles} // Apply the selectStyles
                    />
                  )
                }}
              />
              <Controller
                name='Title'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Title'
                    placeholder='Enter Title'
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
                    fullWidth
                    label='Description'
                    placeholder='Enter Description'
                    error={!!editErrors.Description}
                    helperText={editErrors.Description ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Price'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Price'
                    placeholder='Enter Price'
                    error={!!editErrors.Price}
                    helperText={editErrors.Price ? 'This field is required' : ''}
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
              <Controller
                name='PreviousPrice'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Previous Price'
                    placeholder='Enter Previous Price'
                    error={!!editErrors.PreviousPrice}
                    helperText={editErrors.PreviousPrice ? 'This field is required' : ''}
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
              <Controller
                name='Stock'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Stock'
                    placeholder='Enter Stock'
                    error={!!editErrors.Stock}
                    helperText={editErrors.Stock ? 'This field is required' : ''}
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
              <Controller
                name='Sizes'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Sizes'
                    placeholder='Enter Sizes'
                    error={!!editErrors.Sizes}
                    helperText={editErrors.Sizes ? 'This field is required' : ''}
                  />
                )}
              />
              {/* <Controller
                name='FeatureImage'
                control={editControl}
                rules={{ required: false }}
                render={({ field }) => (
                    <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                    <Button variant='contained' component='label'>
                        Upload Feature Image (Optional)
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
                    {isAdding && <CircularProgress size={24} className='ms-3' />}
                    </Stack>
                )}
                /> */}
              <Controller
                name='Policy'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Policy'
                    placeholder='Enter Policy'
                    error={!!editErrors.Policy}
                    helperText={editErrors.Policy ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Tags'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Tags'
                    placeholder='Enter Tags'
                    error={!!editErrors.Tags}
                    helperText={editErrors.Tags ? 'This field is required' : ''}
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
                    fullWidth
                    label='Featured'
                    placeholder='Enter Featured'
                    error={!!editErrors.Featured}
                    helperText={editErrors.Featured ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Approved'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Approved'
                    placeholder='Enter Approved'
                    error={!!editErrors.Approved}
                    helperText={editErrors.Approved ? 'This field is required' : ''}
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
                    fullWidth
                    label='Status'
                    placeholder='Enter Status'
                    error={!!editErrors.Status}
                    helperText={editErrors.Status ? 'This field is required' : ''}
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
                    fullWidth
                    label='Slug'
                    placeholder='Enter Slug'
                    error={!!editErrors.Slug}
                    helperText={editErrors.Slug ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='ShortDescription'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='ShortDescription'
                    placeholder='Enter ShortDescription'
                    error={!!editErrors.ShortDescription}
                    helperText={editErrors.ShortDescription ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='SKU'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='SKU'
                    placeholder='Enter SKU'
                    error={!!editErrors.SKU}
                    helperText={editErrors.SKU ? 'This field is required' : ''}
                  />
                )}
              />
              {/* Add image upload fields */}
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
                name='Color'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Color'
                    placeholder='Enter Color'
                    error={!!editErrors.Color}
                    helperText={editErrors.Color ? 'This field is required' : ''}
                  />
                )}
              />
              {/* <Controller
                name='Video'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                    <TextField
                    {...field}
                    fullWidth
                    label='Video'
                    placeholder='Enter Video'
                    error={!!editErrors.Video}
                    helperText={editErrors.Video ? 'This field is required' : ''}
                    />
                )}
                /> */}
              <Controller
                name='Attribute'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Attribute'
                    placeholder='Enter Attribute'
                    error={!!editErrors.Attribute}
                    helperText={editErrors.Attribute ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='VendorID'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='VendorID'
                    placeholder='Enter VendorID'
                    error={!!editErrors.VendorID}
                    helperText={editErrors.VendorID ? 'This field is required' : ''}
                  />
                )}
              />
              <Controller
                name='Owner'
                control={editControl}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Owner'
                    placeholder='Enter Owner'
                    error={!!editErrors.Owner}
                    helperText={editErrors.Owner ? 'This field is required' : ''}
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
            </div>
          </form>
        </div>
      </Drawer>

      {/* Title and Search Bar */}
      <Typography variant='h4' component='div' gutterBottom>
        Products Form
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
                placeholder='Search Products'
                inputRef={searchInputRef}
                className='is-full sm:is-auto'
            /> */}
          <Button
            variant='contained'
            onClick={() => setAddProductOpen(!addProductOpen)}
            className='is-full sm:is-auto'
            disabled={isFilterDataLoading} // Disable Add button while loading
          >
            {isFilterDataLoading ? 'Loading...' : 'Add New Product'}
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

export default ProductFilterPage
