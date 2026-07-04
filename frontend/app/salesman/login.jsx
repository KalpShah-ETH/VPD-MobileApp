import AuthForm from '../../src/components/AuthForm';

export default function SalesmanLogin() {
  return <AuthForm role="salesman" requiresPassword={true} />;
}
