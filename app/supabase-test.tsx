import { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { supabase } from "../lib/supabase"

export default function SbTest() {
  const [msg, setMsg] = useState("Checking Supabase...")

  useEffect(() => {
    const run = async () => {
      // 1) Ensure we have a session (sign-in anonymously for the test)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously()
        if (anonErr) return setMsg("❌ Auth error: " + anonErr.message)
      }

      // 2) Insert a test row
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return setMsg("❌ No user ID")

      const { error: insertErr } = await supabase
        .from("test_ping")
        .insert({ user_id: userId, msg: "aloha 🌺" })

      if (insertErr) return setMsg("❌ Insert error: " + insertErr.message)

      // 3) Read it back
      const { data, error } = await supabase
        .from("test_ping")
        .select("msg, inserted_at")
        .order("inserted_at", { ascending: false })
        .limit(1)

      if (error) setMsg("❌ Select error: " + error.message)
      else setMsg("✅ Connected! Latest ping: " + data?.[0]?.msg)
    }
    run()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 18 }}>{msg}</Text>
    </View>
  )
}
