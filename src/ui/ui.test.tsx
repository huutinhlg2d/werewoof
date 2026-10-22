import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Badge, Button, Card, Input, Stack } from '.';

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('ui kit', () => {
  it('Button renders a typed button with variant data attributes', () => {
    const html = render(<Button variant="danger" size="lg" fullWidth>Go</Button>);

    expect(html).toMatch(/^<button /);
    expect(html).toContain('type="button"');
    expect(html).toContain('data-variant="danger"');
    expect(html).toContain('data-size="lg"');
    expect(html).toContain('data-full-width="true"');
  });

  it('asChild styles the child element instead of wrapping it', () => {
    const html = render(
      <Button asChild>
        <a href="#/host">Host</a>
      </Button>,
    );

    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="#/host"');
    expect(html).toContain('data-variant="primary"');
    expect(html).not.toContain('type=');
  });

  it('merges a consumer className with the component class', () => {
    expect(render(<Card className="extra">x</Card>)).toMatch(/class="[^"]*\bextra\b/);
  });

  it('Badge and Card expose their tone', () => {
    expect(render(<Badge tone="success">ok</Badge>)).toContain('data-tone="success"');
    expect(render(<Card tone="raised">x</Card>)).toContain('data-tone="raised"');
  });

  it('Stack maps gap tokens and direction to style', () => {
    const html = render(<Stack direction="row" gap={4} align="center">x</Stack>);

    expect(html).toContain('gap:var(--space-4)');
    expect(html).toContain('flex-direction:row');
    expect(html).toContain('align-items:center');
  });

  it('Input links the label, hint and error for assistive tech', () => {
    const withHint = render(<Input label="Name" hint="Shown to everyone" />);
    expect(withHint).toMatch(/<label[^>]*for="([^"]+)"/);
    expect(withHint).toMatch(/aria-describedby="[^"]+-hint"/);

    const withError = render(<Input label="Name" hint="h" error="Required" />);
    expect(withError).toContain('aria-invalid="true"');
    expect(withError).toMatch(/aria-describedby="[^"]+-error"/);
    expect(withError).toContain('role="alert"');
  });
});
