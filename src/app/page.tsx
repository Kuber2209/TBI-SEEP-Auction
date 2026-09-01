import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/actions';

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/bidder');
  }
}
