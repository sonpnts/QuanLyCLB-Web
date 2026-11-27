'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'

const GuideView = () => {
  return (
    <Card>
      <CardHeader title='Hướng dẫn sử dụng CMIS' className='p-4 sm:p-6' />

      <CardContent className='p-0'>
        <Box
          sx={{
            width: '100%',
            height: {
              xs: 'calc(100vh - 180px)',
              sm: 'calc(100vh - 200px)'
            },
            minHeight: 500,
            overflow: 'hidden'
          }}
        >
          <iframe
            src='https://docs.google.com/document/d/e/2PACX-1vRPOw2anqHiGL45gUWcYlR8mAdzClu9EmCiM0gx_HXxpZciUkbkVIj6UHIsNd36vSEqNzEq_hxfMdgp/pub?embedded=true'
            title='Hướng dẫn sử dụng CMIS'
            width='100%'
            height='100%'
            style={{
              border: 'none',
              display: 'block'
            }}
            loading='lazy'
            allowFullScreen
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default GuideView
