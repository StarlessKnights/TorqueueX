import { Part } from "../interfaces/Part";

export default function TableBody({ parts }: { parts: Part[] }) {
  return (
    <tbody className="[&_tr:nth-child(odd)]:bg-zinc-900 [&_tr:nth-child(even)]:bg-zinc-800/70 ">
      {parts.map((part) => (
        <tr key={part.id} className="hover:bg-zinc-700/80">
          <td className="px-4 py-5 text-center text-gray-300">
            {part.priority}
          </td>
        </tr>
      ))}
    </tbody>
  );
}
