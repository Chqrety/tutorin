import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal"
import { Button } from "@heroui/button"
import { ReactNode } from "react"

interface AppProps {
  children: ReactNode
  color?: "primary" | "secondary" | "danger"
  title: ReactNode
  onClick: () => void
}

export default function App({ children, color, title, onClick }: AppProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <>
      <Button size="sm" color={color} onPress={onOpen}>
        {children}
      </Button>
      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{/* title */}</ModalHeader>
              <ModalBody>
                <p>Are you sure you want to delete question of</p>
                <p className="font-bold">"{title}"</p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={onClick}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
