import { use } from 'react'

import BeltExamDetails from '@/views/apps/belt-exam/details'

const BeltExamDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params)

  
return <BeltExamDetails id={resolvedParams.id} />
}

export default BeltExamDetailsPage
