import { columns } from "@/components/orders/order-columns";
import { FilteredDataTable } from "@/components/tables/filtered-data-table";
import { SynchronizedChart } from "@/components/charts/synchronized-chart";
import { OrderFilterProvider } from "@/contexts/order-filter-context";
import { ordersChartConfig } from "@/components/orders/order-chart-config";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  // Check authentication server-side
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Redirect unauthenticated users to homepage
  if (error || !user) {
    redirect('/');
  }
  
  return (
    <OrderFilterProvider>
      <div className="flex min-h-screen flex-col items-center justify-start md:justify-center p-4 sm:p-8 md:p-12 lg:p-24 overflow-x-hidden">
        <div className="w-full max-w-[1500px] flex justify-center">
          <div className="flex flex-col gap-12 w-full lg:w-3/5">
            <div className="w-full">
              <FilteredDataTable 
                title="Orders Data"
                description="View and filter your orders data by date, category, source, and location. Filters are synchronized with the chart below."
                columns={columns} 
              />
            </div>
            <div className="w-full">
              <SynchronizedChart
                config={{
                  title: "Orders by Category",
                  description: "Grouped by category. Click segments to filter data or use table filters above.",
                  groupByKey: "category",
                  chartConfig: ordersChartConfig,
                  countLabel: "Orders",
                  enableChartTypeToggle: true,
                  defaultChartType: "pie",
                  enableInteractiveFiltering: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </OrderFilterProvider>
  );
}