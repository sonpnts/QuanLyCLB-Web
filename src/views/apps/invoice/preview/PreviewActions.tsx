'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

type Props = {
  onPrint: () => void
}

const PreviewActions = ({ onPrint }: Props) => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-4'>
        <Button
          fullWidth
          variant='contained'
          startIcon={<i className='ri-printer-line' />}
          onClick={onPrint}
        >
          In biên lai
        </Button>
        <Button
          fullWidth
          color='secondary'
          variant='outlined'
          component={Link}
          href='/apps/payment/list'
          startIcon={<i className='ri-arrow-left-line' />}
        >
          Quay lại danh sách
        </Button>
      </CardContent>
    </Card>
  )
}

export default PreviewActions

