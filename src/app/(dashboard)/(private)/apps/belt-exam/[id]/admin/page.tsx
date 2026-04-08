import BeltExamAdminView from '@/views/apps/belt-exam/admin-view'

interface Props {
  params: Promise<{ id: string }>
}

const BeltExamAdminPage = async ({ params }: Props) => {
  const { id } = await params

  return <BeltExamAdminView sessionId={id} />
}

export default BeltExamAdminPage
