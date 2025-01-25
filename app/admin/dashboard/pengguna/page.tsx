"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type User = {
  id: number
  name: string
  email: string
  role: "Admin" | "User"
}

const initialUsers: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "User" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Admin" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "User" },
]

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [newUser, setNewUser] = useState<Omit<User, "id">>({
    name: "",
    email: "",
    role: "User",
  })

  const handleAddUser = () => {
    const id = Math.max(...users.map((u) => u.id)) + 1
    setUsers([...users, { id, ...newUser }])
    setNewUser({ name: "", email: "", role: "User" })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h2>

      <Dialog>
        <DialogTrigger asChild>
          <Button>Tambah Pengguna</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Masukkan detail pengguna baru di sini.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name">Nama</label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "Admin" | "User" })}
                className="col-span-3"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddUser}>Tambah Pengguna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

