// MUI Imports
import { useState } from 'react'

import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
// import IconExpandLess from '@mui/icons-material/ExpandLess'

// import IconExpandMore from '@mui/icons-material/ExpandMore'

// import { Collapse, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'

import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'

// Hook Imports

import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached } = useVerticalNav()
  const [openFilters, setOpenFilters] = useState(false)

  // Vars
  const { transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/home' icon={<i className='ri-home-smile-line' />}>
          <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>Home </span>
        </MenuItem>
        <SubMenu
          // onClick={() => setOpenFilters(!openFilters)}
          // href='/edit-filters'
          label={<span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>Master</span>}
          icon={<i className='ri-filter-2-line' />}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <MenuItem href='/master/solitaire'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Solitaire
            </span>
          </MenuItem>
          <MenuItem href='/master/shapes'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Shapes
            </span>
          </MenuItem>
          <MenuItem href='/master/carat'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Carat
            </span>
          </MenuItem>
          <MenuItem href='/master/color'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Color
            </span>
          </MenuItem>
          <MenuItem href='/master/fluor'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Fluor
            </span>
          </MenuItem>
          <MenuItem href='/master/purity'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Purity
            </span>
          </MenuItem>
          <MenuItem href='/master/cut'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>&nbsp;&nbsp;&nbsp;&nbsp;Cut</span>
          </MenuItem>
          <MenuItem href='/master/lab'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>&nbsp;&nbsp;&nbsp;&nbsp;Lab</span>
          </MenuItem>
          <MenuItem href='/master/polish'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Polish
            </span>
          </MenuItem>
          <MenuItem href='/master/symm'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Symm.
            </span>
          </MenuItem>
          <MenuItem href='/master/location'>
            <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;Location
            </span>
          </MenuItem>
        </SubMenu>
        <MenuItem href='/about' icon={<i className='ri-information-line' />}>
          <span style={{ fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif' }}>About </span>
        </MenuItem>
      </Menu>
      {/* <Menu
          popoutMenuOffset={{ mainAxis: 17 }}
          menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
          renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
          renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
          menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
        >
          <GenerateVerticalMenu menuData={menuData(dictionary, params)} />
        </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
