import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';

export async function ownsProject(userId: string, projectId: string): Promise<boolean> {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);
  return Boolean(project);
}
