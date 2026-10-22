import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isValidCode, normalizeCode } from '@/net/peer';
import { Button, Input, Page, Stack } from '@/ui';
import { loadName, saveName } from './storage';

const NAME_MAX = 24;

export function JoinPage() {
  const { code: initialCode = '' } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(normalizeCode(initialCode));
  const [name, setName] = useState(loadName);
  const [submitted, setSubmitted] = useState(false);

  const codeError = !isValidCode(code) ? 'Enter the 5-character room code.' : undefined;
  const nameError = !name.trim() ? 'Enter a name.' : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (codeError || nameError) return;
    saveName(name.trim());
    navigate(`/play/${code}`);
  };

  return (
    <Page>
      <h1>Join a game</h1>
      <form onSubmit={submit} noValidate>
        <Stack gap={4}>
          <Input
            label="Room code"
            value={code}
            maxLength={5}
            autoCapitalize="characters"
            autoComplete="off"
            error={submitted ? codeError : undefined}
            onChange={(event) => setCode(normalizeCode(event.target.value))}
          />
          <Input
            label="Your name"
            value={name}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            hint="Everyone in the lobby sees this."
            error={submitted ? nameError : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" size="lg" fullWidth>
            Join
          </Button>
        </Stack>
      </form>
    </Page>
  );
}
