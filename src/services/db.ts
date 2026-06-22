import Dexie, { Table } from 'dexie';
import { ProjectData } from '../types';

export class MarkzyDatabase extends Dexie {
  projects!: Table<ProjectData, number>;

  constructor() {
    super('MarkzyDB');
    this.version(1).stores({
      projects: '++id, projectId, schoolName, subject, academicYear, createdAt'
    });
  }
}

export const db = new MarkzyDatabase();

export const saveProject = async (project: ProjectData) => {
  if (project.id) {
    project.updatedAt = new Date().toISOString();
    return await db.projects.put(project);
  } else {
    project.createdAt = new Date().toISOString();
    project.updatedAt = project.createdAt;
    return await db.projects.add(project);
  }
};

export const getAllProjects = async () => {
  return await db.projects.orderBy('updatedAt').reverse().toArray();
};

export const getProjectById = async (projectId: string) => {
  return await db.projects.where('projectId').equals(projectId).first();
};

export const deleteProject = async (id: number) => {
  return await db.projects.delete(id);
};
