// MUI Imports
// import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'



// Third-party imports
import classnames from 'classnames'

// Types Imports
import type { SidebarLeftProps } from '@/types/apps/calendarTypes'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Slice Imports
import {  filterClassesSet } from '@/redux-store/slices/calendar'


const SidebarLeft = (props: SidebarLeftProps) => {
  // Props
  const {
    mdAbove,
    leftSidebarOpen,
    calendarStore,
    calendarApi,
    dispatch,
    handleLeftSidebarToggle
  } = props


  // Build class filters from events (unique class names)
  const availableClasses = Array.from(
    new Set(
      (calendarStore.filteredEvents || [])
        .map(ev => (ev.extendedProps as any)?.className as string | undefined)
        .filter((v): v is string => !!v)
    )
  ).sort() // Sort alphabetically

  // const handleSidebarToggleSidebar = () => {
  //   dispatch(selectedEvent(null))
  //   handleAddEventSidebarToggle()
  // }

  // Always show sidebar for calendar navigation
  return (
    <Drawer
      open={leftSidebarOpen}
      onClose={handleLeftSidebarToggle}
      variant={mdAbove ? 'permanent' : 'temporary'}
      ModalProps={{
        disablePortal: true,
        disableAutoFocus: true,
        disableScrollLock: true,
        keepMounted: true
      }}
      className={classnames('block', { static: mdAbove, absolute: !mdAbove })}
      PaperProps={{
        className: classnames('items-start is-[280px] shadow-none rounded rounded-se-none rounded-ee-none', {
          static: mdAbove,
          absolute: !mdAbove
        })
      }}
      sx={{
        zIndex: 3,
        '& .MuiDrawer-paper': {
          zIndex: mdAbove ? 2 : 'drawer'
        },
        '& .MuiBackdrop-root': {
          borderRadius: 1,
          position: 'absolute'
        }
      }}
    >
      {/*<div className='is-full p-5'>*/}
      {/*  <Button*/}
      {/*    fullWidth*/}
      {/*    variant='contained'*/}
      {/*    onClick={handleSidebarToggleSidebar}*/}
      {/*    startIcon={<i className='ri-add-line' />}*/}
      {/*  >*/}
      {/*    Add Event*/}
      {/*  </Button>*/}
      {/*</div>*/}
      <Divider className='is-full' />
      <AppReactDatepicker
        inline
        onChange={date => calendarApi.gotoDate(date)}
        locale='vi'
        boxProps={{
          className: 'flex justify-center is-full',
          sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
        }}
      />
      {availableClasses.length > 0 && (
        <>
          <Divider className='is-full' />
          <div className='flex flex-col p-5 is-full'>
            <Typography variant='h5' className='mbe-4'>
              Lọc theo lớp học
            </Typography>
            <FormControlLabel
              className='mbe-2'
              label='Xem tất cả'
              control={
                <Checkbox
                  color='secondary'
                  checked={!calendarStore.selectedClasses || calendarStore.selectedClasses.length === 0}
                  onChange={() => dispatch(filterClassesSet([]))}
                />
              }
            />
            <FormGroup>
              {availableClasses.map(cls => {
                const isSelected = (calendarStore.selectedClasses || []).includes(cls)

                return (
                  <FormControlLabel
                    key={cls}
                    className='mbe-1'
                    label={cls}
                    control={
                      <Checkbox
                        color='primary'
                        checked={isSelected}
                        onChange={(_, checked) => {
                          const currentSelected = [...(calendarStore.selectedClasses || [])]
                          let newSelected: string[]

                          if (checked) {
                            // Add class to selection
                            if (!currentSelected.includes(cls)) {
                              newSelected = [...currentSelected, cls]
                            } else {
                              newSelected = currentSelected
                            }
                          } else {
                            // Remove class from selection
                            newSelected = currentSelected.filter(c => c !== cls)
                          }

                          dispatch(filterClassesSet(newSelected))
                        }}
                      />
                    }
                  />
                )
              })}
            </FormGroup>
          </div>
        </>
      )}
    </Drawer>
  )
}

export default SidebarLeft
