// Component Imports
import ClassList from '@views/apps/class/list'

const ClassListApp = async () => {
  // Note: In production, fetch data from API here
  // const classData = await classService.getClasses()
  // For now, using empty array - data will be loaded client-side

  return <ClassList classData={[]} />
}

export default ClassListApp

