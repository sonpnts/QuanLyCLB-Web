// Component Imports
import Preview from '@views/apps/invoice/preview'

const PreviewPage = async (props: { params: Promise<{ id: string }> }) => {
  const params = await props.params

  // id = URL-encoded receiptNumber, e.g. "RCP-20240101-001"
  const receiptNumber = decodeURIComponent(params.id)

  return <Preview id={receiptNumber} />
}

export default PreviewPage
