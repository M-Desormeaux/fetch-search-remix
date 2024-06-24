import { Form, json, redirect, useActionData } from "@remix-run/react";
import { BASE_URL } from "~/constants";

import type { ActionFunctionArgs } from "@remix-run/node";
import type { MetaFunction } from "@vercel/remix";

export const meta: MetaFunction = () => {
  return [{ title: "Doggy Dream Home | Login" }];
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

  const data = await response.headers?.getSetCookie().toString();

  console.log("Log In Cookies", data, response);

  return redirect("/search", { headers: { "Set-Cookie": data } });
};

export default function Index() {
  const actionData = useActionData<ActionData>();

  return (
    <div className="flex min-h-lvh flex-col items-center justify-center whitespace-break-spaces">
      <div className="flex w-fit flex-col items-center justify-end gap-3 pb-20">
        <Form method="post" className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 rounded bg-white p-4 drop-shadow">
            <h1 className="text-3xl">Submit Your Info</h1>
            <div>
              <label className="flex items-center gap-1">
                Name:
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="And who are you?"
                  className="rounded border bg-gray-50 p-1"
                />
              </label>
            </div>
            <div>
              <label className="flex items-center justify-end gap-1">
                Email:
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="arrow@knee.adventure"
                  className="rounded border bg-gray-50 p-1"
                />
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="place-content-start rounded border border-green-600 bg-green-100 px-4 py-2 text-xl font-semibold drop-shadow hover:drop-shadow-md active:drop-shadow-sm"
          >
            Submit
          </button>
        </Form>
        {actionData?.error && (
          <p style={{ color: "red" }}>{actionData.error}</p>
        )}
      </div>
    </div>
  );
}
