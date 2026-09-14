export type ContainerType = "daily" | "personal" | "work" | "backlog";
export type Cadence = "daily" | "weekdays" | "weekly";

export interface Container {
  id: number;
  name: string;
  type: ContainerType;
  date: string | null;
}

export interface ContainerCounts extends Container {
  total: number;
  undone: number;
}

export interface Task {
  id: number;
  container_id: number;
  subject: string;
  notes: string;
  done: 0 | 1;
  carried: 0 | 1;
  position: number;
  created_at: string;
  completed_at: string | null;
}

export interface Recurring {
  id: number;
  subject: string;
  notes: string;
  cadence: Cadence;
  weekday: number | null;
  active: 0 | 1;
}

export interface HeatCell {
  id: number;
  date: string;
  total: number;
  done: number;
}

export interface CarryoverInfo {
  fromId: number;
  fromDate: string;
  count: number;
}

export interface DashboardData {
  today: ContainerCounts & { tasks: Task[] };
  fixed: ContainerCounts[];
  activeDailies: ContainerCounts[];
  archivedDailies: ContainerCounts[];
  carryover: CarryoverInfo | null;
  heatmap: HeatCell[];
}

export interface ContainerData {
  container: ContainerCounts;
  tasks: Task[];
  containers: Container[];
}

export interface SearchResult extends Task {
  container_name: string;
  container_type: ContainerType;
  container_date: string | null;
}
