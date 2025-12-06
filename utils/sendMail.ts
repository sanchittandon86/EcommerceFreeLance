export async function sendEmail(data:any) {
  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  } catch (error) {
    console.error(error)
  }
}