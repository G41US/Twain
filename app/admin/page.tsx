import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export default async function Admin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return <div className="p-8">Access denied.</div>;

  const users = await prisma.user.findMany({ take: 50 });
  const stats = await prisma.user.aggregate({
    _count: { _all: true },
    _avg: { replyRate: true },
  });

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg">Total Users: {stats._count._all}</div>
        <div className="bg-green-100 p-6 rounded-lg">Avg Reply Rate: {Math.round(stats._avg.replyRate || 0)}%</div>
        <div className="bg-purple-100 p-6 rounded-lg">Active Today: 42</div>
      </div>
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border">
          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Reply Rate</th>
              <th className="border p-2">Ethnicity Pref</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td className="border p-2">{u.name}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{Math.round(u.replyRate)}%</td>
                <td className="border p-2">{u.preferEthnicity}</td>
                <td className="border p-2">
                  <button className="bg-red-600 text-white px-2 py-1 rounded mr-2">Ban</button>
                  <button className="bg-blue-600 text-white px-2 py-1 rounded">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
