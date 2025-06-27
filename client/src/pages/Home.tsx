import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import RequestForm from "@/components/RequestForm";
import RequestsList from "@/components/RequestsList";
import NotFound from "@/pages/not-found";

export default function Home() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/requests" component={RequestsList} />
        <Route path="/create" component={RequestForm} />
        <Route path="/reports" component={() => <div>Reports Page</div>} />
        <Route path="/users" component={() => <div>User Management Page</div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
