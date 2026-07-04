import AuthForm from '../../src/components/AuthForm';

export default function AdminLogin() {
  return <AuthForm role="admin" requiresPassword={true} />;
}
