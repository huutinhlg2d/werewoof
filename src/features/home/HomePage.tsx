import { Link } from 'react-router-dom';
import { Button, Page, Stack } from '@/ui';

export function HomePage() {
  return (
    <Page>
      <h1>Werewoof</h1>
      <p>Play werewolf with everyone on their own phone.</p>
      <Stack gap={3}>
        <Button asChild size="lg" fullWidth>
          <Link to="/join">Join a game</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" fullWidth>
          <Link to="/host">Host a game</Link>
        </Button>
      </Stack>
    </Page>
  );
}
