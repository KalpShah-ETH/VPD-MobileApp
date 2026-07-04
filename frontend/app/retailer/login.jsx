import AuthForm from '../../src/components/AuthForm';

export default function RetailerLogin() {
  return <AuthForm role="retailer" requiresPassword={false} />;
}
