import ClassViewPage from '@/views/apps/class/view'

type Props = {
  params: Promise<{ id: string }>
}

const ClassView = async ({ params }: Props) => {
  const { id } = await params

  return <ClassViewPage classId={id} />
}

export default ClassView
