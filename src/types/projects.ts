export type Project = {
  title: string;
  url: string;
  description: string;
};

export type ProjectsData = {
  title: string;
  description: string;
  projects: Project[];
};
