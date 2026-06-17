import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            GigMatch
          </h1>
          <p className="text-xl text-zinc-400">Freelance Marketplace for Indian Creators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Find Gigs</CardTitle>
              <CardDescription>Browse thousands of micro-gigs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Browse Gigs</Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Post a Gig</CardTitle>
              <CardDescription>Hire talented freelancers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">Post Requirement</Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Build Portfolio</CardTitle>
              <CardDescription>Showcase your work</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Create Profile</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App