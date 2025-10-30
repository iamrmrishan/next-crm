import { ChartConfig } from "../ui/chart";

export const ordersChartConfig = {
  Electronics: { label: "Electronics", color: "var(--chart-1)" },
  Clothing: { label: "Clothing", color: "var(--chart-2)" },
  Books: { label: "Books", color: "var(--chart-3)" },
  Furniture: { label: "Furniture", color: "var(--chart-4)" },
  "Home & Kitchen": { label: "Home & Kitchen", color: "var(--chart-5)" },
  Sports: { label: "Sports", color: "var(--chart-6)" },
  Toys: { label: "Toys", color: "var(--chart-7)" },
  Beauty: { label: "Beauty", color: "var(--chart-8)" },
  Groceries: { label: "Groceries", color: "var(--chart-9)" },
} satisfies ChartConfig


export const filterOptions = ["Online", "In-Store", "App", "Phone"];