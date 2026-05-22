import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-secondary overflow-y-auto">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            <span className="text-primary">◆</span> ADMIN
          </Link>
        </div>

        <nav className="px-4 py-6 space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 text-sm rounded hover:bg-background transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-2 text-sm rounded hover:bg-background transition"
          >
            Products
          </Link>
          <Link
            href="/admin/preorders"
            className="block px-4 py-2 text-sm rounded hover:bg-background transition"
          >
            Pre-Orders
          </Link>
          <Link
            href="/"
            className="block px-4 py-2 text-sm rounded hover:bg-background transition text-primary"
          >
            ← Back to Store
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
