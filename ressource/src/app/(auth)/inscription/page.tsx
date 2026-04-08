import SignInPage from "./form-signup";

export default async function SignIn() {
  return (
    <div className="min-h-screen flex flex-row items-center justify-between bg-gray-50">
<div className="w-full  flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl font-bold">Bienvenue</h1>
          <p className="text-gray-500 mt-2 mb-8">Inscrivez-vous à (Re)Sources</p>
          <SignInPage />
        </div>
      
      </div>
  )
}