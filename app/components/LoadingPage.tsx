import { Spinner } from "@heroui/spinner"

export default function LoadingPage() {
  return (
    <div className="flex flex-col mt-36 w-full justify-center items-center">
      <Spinner />
      <p className="text-gray-500">Loading...</p>
    </div>
  )
}
