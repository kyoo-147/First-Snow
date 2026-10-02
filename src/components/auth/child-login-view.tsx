"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthApiError, getChildren } from "./auth-api";
import { ChildProfileSelector } from "./child-profile-selector";
import { ChildPinPad } from "./child-pin-pad";
import type { ChildProfileSummary } from "./auth-types";

export function ChildLoginView() {
  const searchParams = useSearchParams();
  const preselectedChildId = searchParams.get("childId");

  const [childrenList, setChildrenList] = useState<ChildProfileSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfiles() {
      setIsLoading(true);
      setAuthRequired(false);
      setAuthErrorMessage(null);

      try {
        const list = await getChildren();
        if (isMounted) {
          setChildrenList(list);
          if (preselectedChildId) {
            const found = list.find((c) => c.id === preselectedChildId);
            if (found) {
              setSelectedChild(found);
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setChildrenList([]);
          if (err instanceof AuthApiError && (err.statusCode === 401 || err.statusCode === 403)) {
            setAuthRequired(true);
            setAuthErrorMessage(err.message);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfiles();

    return () => {
      isMounted = false;
    };
  }, [preselectedChildId]);

  if (selectedChild) {
    return <ChildPinPad child={selectedChild} onBack={() => setSelectedChild(null)} />;
  }

  return (
    <ChildProfileSelector
      childrenList={childrenList}
      onSelectChild={(child) => setSelectedChild(child)}
      isLoading={isLoading}
      authRequired={authRequired}
      authErrorMessage={authErrorMessage}
    />
  );
}
