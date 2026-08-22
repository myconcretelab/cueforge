import type { FastifyInstance } from 'fastify';
import { requireUser } from '../services/auth.js';
import { parseSoundShowProject } from '../services/soundshow.js';

const maxProjectBytes = 5 * 1024 * 1024;

export async function importRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/imports/soundshow/analyze', async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const file = await request.file({ limits: { files: 1, fileSize: maxProjectBytes } });
    if (!file || !file.filename.toLowerCase().endsWith('.ssp')) {
      return reply.code(400).send({ error: 'Sélectionnez un fichier de projet SoundShow .ssp.' });
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of file.file) {
      size += chunk.length;
      if (size > maxProjectBytes) return reply.code(413).send({ error: 'Le projet SoundShow dépasse 5 Mo.' });
      chunks.push(Buffer.from(chunk));
    }
    return { analysis: parseSoundShowProject(Buffer.concat(chunks)) };
  });
}
