export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import LogoutButton from "./_components/LogoutButton";
import DeleteButton from "./_components/DeleteButton";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";
import AccountButton from "./_components/AccountButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1) Tipo
type Vehicle = {
  id: number;
  name: string;
  brand: string | null;
  price: string | null;
  year: string | null;
  badge: string | null;
  available: boolean;
  spotlight: boolean;
  created_at: string;
  updated_at: string | null; // <— add
};

// 2) SortColumn
type SortColumn =
  | "id"
  | "name"
  | "brand"
  | "year"
  | "price"
  | "created_at"
  | "updated_at"
  | "spotlight";
type SortOrder = "asc" | "desc";

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/painel")}`);
  }

  const spRaw = await searchParams;
  const sp = Object.fromEntries(
    Object.entries(spRaw ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  ) as Record<string, string | undefined>;

  const page = Math.max(1, Number.parseInt(sp.p ?? "1") || 1);
  const rpp = Number.parseInt(sp.rpp ?? "15") || 15;
  const offset = (page - 1) * rpp;

  // Filtros
  const filterId = sp.id?.trim();
  const filterName = sp.name?.trim();
  const filterBrand = sp.brand?.trim();
  const filterStatus = sp.status?.trim();

  // Ordenação (default = updated_at desc)
  const sortColumn = (sp.sort ?? "updated_at") as SortColumn; // <— updated_at default
  const sortOrder = (sp.order ?? "desc") as SortOrder;

  // Query base (inclui updated_at)
  let query = supabase
    .from("vehicles")
    .select(
      "id, name, brand, price, year, badge, available, spotlight, created_at, updated_at",
      { count: "exact" }
    );

  // Aplicar filtros
  if (filterId) {
    const idNum = Number.parseInt(filterId);
    if (!isNaN(idNum)) {
      query = query.eq("id", idNum);
    }
  }
  if (filterName) {
    query = query.ilike("name", `%${filterName}%`);
  }
  if (filterBrand) {
    query = query.ilike("brand", `%${filterBrand}%`);
  }
  if (filterStatus && filterStatus !== "todos") {
    if (filterStatus === "disponivel") {
      query = query.eq("available", true);
    } else if (filterStatus === "indisponivel") {
      query = query.eq("available", false);
    } else if (filterStatus === "destaque") {
      query = query.eq("spotlight", true);
    }
  }

  // Aplicar ordenação com fallback de recência
  if (sortColumn === "spotlight") {
    query = query.order("spotlight", { ascending: sortOrder === "asc" });
    query = query
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sortColumn === "updated_at") {
    query = query
      .order("updated_at", { ascending: sortOrder === "asc" })
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order(sortColumn, { ascending: sortOrder === "asc" })
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + rpp - 1);

  const { data, error, count } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <LogoutButton />
        </div>
        <p className="text-red-600">Erro ao carregar veículos: {error.message}</p>
      </main>
    );
  }

  const vehicles = (data ?? []) as Vehicle[];
  const totalRows = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / rpp));

  const hasFilters = !!(
    filterId ||
    filterName ||
    filterBrand ||
    (filterStatus && filterStatus !== "todos")
  );

  // Função helper para gerar links de ordenação
  function buildSortLink(column: SortColumn) {
    const newOrder =
      sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams();
    params.set("sort", column);
    params.set("order", newOrder);
    params.set("rpp", String(rpp));
    params.set("p", "1");
    if (filterId) params.set("id", filterId);
    if (filterName) params.set("name", filterName);
    if (filterBrand) params.set("brand", filterBrand);
    if (filterStatus) params.set("status", filterStatus);
    return `/painel?${params.toString()}`;
  }

  // Função helper para gerar links de paginação
  function buildPageLink(newPage: number) {
    const params = new URLSearchParams();
    params.set("p", String(newPage));
    params.set("rpp", String(rpp));
    if (sortColumn) params.set("sort", sortColumn);
    if (sortOrder) params.set("order", sortOrder);
    if (filterId) params.set("id", filterId);
    if (filterName) params.set("name", filterName);
    if (filterBrand) params.set("brand", filterBrand);
    if (filterStatus) params.set("status", filterStatus);
    return `/painel?${params.toString()}`;
  }

  // Componente de ícone de ordenação
  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  }

  // garanta que não apareça "Página 3 de 2"
  const displayPage = Math.min(page, totalPages);

  return (
    <main className="mx-auto max-w-7xl p-6 pb-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Veículos</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalRows} veículo(s) cadastrado(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {session?.user?.name ?? "Admin"}
          </span>
          <AccountButton />
          <LogoutButton />
        </div>
      </div>

      {/* Filtros */}
      <form method="get" className="mb-4 p-4 bg-white rounded-xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">ID</label>
            <input
              type="number"
              name="id"
              defaultValue={filterId}
              placeholder="Ex: 6"
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Nome</label>
            <input
              type="text"
              name="name"
              defaultValue={filterName}
              placeholder="Ex: Golf"
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Marca</label>
            <input
              type="text"
              name="brand"
              defaultValue={filterBrand}
              placeholder="Ex: Volkswagen"
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Status</label>
            <select
              name="status"
              defaultValue={filterStatus ?? "todos"}
              className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="indisponivel">Indisponível</option>
              <option value="destaque">Em Destaque</option>
            </select>
          </div>
        </div>

        {/* Manter ordenação e itens por página ao filtrar */}
        <input type="hidden" name="sort" value={sortColumn} />
        <input type="hidden" name="order" value={sortOrder} />
        <input type="hidden" name="rpp" value={rpp} />

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href={`/painel?rpp=${rpp}&sort=${sortColumn}&order=${sortOrder}`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Link>
          )}
        </div>
      </form>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600" htmlFor="rpp">
            Itens por página:
          </label>

          <form method="get" className="flex items-center gap-2">
            {/* mantém os parâmetros atuais */}
            <input type="hidden" name="p" value="1" />
            <input type="hidden" name="sort" value={sortColumn} />
            <input type="hidden" name="order" value={sortOrder} />
            {filterId && <input type="hidden" name="id" value={filterId} />}
            {filterName && <input type="hidden" name="name" value={filterName} />}
            {filterBrand && <input type="hidden" name="brand" value={filterBrand} />}
            {filterStatus && <input type="hidden" name="status" value={filterStatus} />}

            <select
              id="rpp"
              name="rpp"
              defaultValue={String(rpp)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="35">35</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Aplicar
            </button>
          </form>
        </div>

        <Link
          href="/painel/veiculo/novo"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
        >
          + Novo Veículo
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <Link
                  href={buildSortLink("id")}
                  className="flex items-center gap-1 hover:text-blue-600 font-semibold text-gray-700"
                >
                  ID
                  <SortIcon column="id" />
                </Link>
              </th>
              <th className="px-4 py-3 text-left">
                <Link
                  href={buildSortLink("name")}
                  className="flex items-center gap-1 hover:text-blue-600 font-semibold text-gray-700"
                >
                  Nome
                  <SortIcon column="name" />
                </Link>
              </th>
              <th className="px-4 py-3 text-left">
                <Link
                  href={buildSortLink("brand")}
                  className="flex items-center gap-1 hover:text-blue-600 font-semibold text-gray-700"
                >
                  Marca
                  <SortIcon column="brand" />
                </Link>
              </th>
              <th className="px-4 py-3 text-left">
                <Link
                  href={buildSortLink("year")}
                  className="flex items-center gap-1 hover:text-blue-600 font-semibold text-gray-700"
                >
                  Ano
                  <SortIcon column="year" />
                </Link>
              </th>
              <th className="px-4 py-3 text-left">
                <Link
                  href={buildSortLink("price")}
                  className="flex items-center gap-1 hover:text-blue-600 font-semibold text-gray-700"
                >
                  Preço
                  <SortIcon column="price" />
                </Link>
              </th>
              <th className="px-4 py-3 text-center">
                <Link
                  href={buildSortLink("spotlight")}
                  className="flex items-center justify-center gap-1 hover:text-blue-600 font-semibold text-gray-700"
                >
                  Status
                  <SortIcon column="spotlight" />
                </Link>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">{v.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{v.name}</div>
                  {v.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                      {v.badge}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{v.brand ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{v.year ?? "—"}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">
                  {v.price ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        v.available
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {v.available ? "Disponível" : "Indisponível"}
                    </span>
                    {v.spotlight && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⭐ Destaque
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/painel/veiculo/${v.id}`}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Editar
                    </Link>
                    <DeleteButton vehicleId={v.id} vehicleName={v.name} />
                  </div>
                </td>
              </tr>
            ))}
            {!vehicles.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <div className="text-gray-400 text-5xl mb-3">🚗</div>
                  <p className="font-medium">
                    {hasFilters
                      ? "Nenhum veículo encontrado com os filtros aplicados"
                      : "Nenhum veículo cadastrado ainda"}
                  </p>
                  <p className="text-sm mt-1">
                    {hasFilters
                      ? "Tente ajustar os filtros"
                      : "Clique em 'Novo Veículo' para começar"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Página {page} de {totalPages} • Exibindo {vehicles.length} de{" "}
          {totalRows} veículos
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={buildPageLink(page - 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Anterior
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={buildPageLink(page + 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Próxima →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
