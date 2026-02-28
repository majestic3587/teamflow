import { createClient } from "@/utils/supabase/server"

export default async function Page() {
  const supabase = await createClient()

  const { data: tasks } = await supabase.from('tasks').select()

  return (
    <ul>
      {tasks?.map((task, index) => (
        <li key={index}>{task.title}</li>
      ))}
    </ul>
  )
}