import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, json, redirect, useActionData } from "@remix-run/react";
import { BASE_URL } from "~/constants";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type ActionData = {
  error?: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");

  const apiEndpoint = BASE_URL + "/auth/login";

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name, email }),
  });

  if (!response.ok) {
    return json({ error: "Failed to submit form data" }, { status: 500 });
  }

  const data = response.headers.getSetCookie().toString();

  return redirect("/search", { headers: { "Set-Cookie": data } });
};

export default function Index() {
  const actionData = useActionData<ActionData>();

  return (
    <div>
      <h1>Submit Your Info</h1>
      <Form method="post">
        <div>
          <label>
            Name:
            <input
              defaultValue="Mike"
              type="text"
              name="name"
              required
              className="border p-1 bg-gray-50"
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              defaultValue="mike@email.com"
              type="email"
              name="email"
              required
              className="border p-1 bg-gray-50"
            />
          </label>
        </div>
        <button type="submit" className="border p-1 bg-gray-50">
          Submit
        </button>
      </Form>
      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
    </div>
  );
}
