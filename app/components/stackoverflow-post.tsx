import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ChevronDown, ChevronUp, MessageSquare, Share2 } from "lucide-react"

export default function StackOverflowPost() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold">How to center a div?</h1>
          <Button variant="outline">Ask Question</Button>
        </CardHeader>
        <CardContent>
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <Button variant="ghost" size="icon">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="font-bold my-2">42</span>
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow">
              <p className="mb-4">
                I'm trying to center a div horizontally and vertically within its parent container. I've tried using
                margin: auto but it's not working as expected. Any help would be appreciated!
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    Follow
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="@johndoe" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p>asked 2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="ml-auto">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add a comment
          </Button>
        </CardFooter>
      </Card>

      <h2 className="text-xl font-bold mb-4">2 Answers</h2>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <Button variant="ghost" size="icon">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="font-bold my-2">23</span>
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow">
              <p className="mb-4">
                To center a div both horizontally and vertically within its parent, you can use Flexbox. Here's an
                example:
              </p>
              <pre className="bg-gray-100 p-4 rounded-md mb-4">
                {`.parent {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Adjust as needed */
}

.child {
  /* Your styles here */
}`}
              </pre>
              <p>This will center the child div both horizontally and vertically within the parent container.</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="@janedoe" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Jane Doe</p>
                    <p>answered 1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Button variant="ghost" className="mb-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add a comment
          </Button>
          <div className="w-full pl-8 border-l-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Great answer! You might also want to mention that for older browsers, you could use the transform method
              as a fallback.
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>- Alice (30 mins ago)</span>
              <Button variant="ghost" size="sm">
                Reply
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <Button variant="ghost" size="icon">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="font-bold my-2">7</span>
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow">
              <p className="mb-4">Another approach is to use CSS Grid. Here's how you can do it:</p>
              <pre className="bg-gray-100 p-4 rounded-md mb-4">
                {`.parent {
  display: grid;
  place-items: center;
  height: 100vh; /* Adjust as needed */
}

.child {
  /* Your styles here */
}`}
              </pre>
              <p>This method is even simpler and works great for centering a single child element.</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="@bobsmith" />
                    <AvatarFallback>BS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Bob Smith</p>
                    <p>answered 30 mins ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="ml-auto">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add a comment
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

