"use server";
export async function getProfessionalDetails(params) {
  const query = new URLSearchParams({
    start: params.start || 0,
    limit: params.limit || 5,
    envelopestatus: params.envelopestatus || 1,
  }).toString();

  try {
    const res = await fetch(`${process.env.API_URL}/get-professional-data?${query}`, {
      method: "GET",
      next: { revalidate: 0 }, // Revalidate every 0 seconds
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return { status: false, msg: "Something went wrong!" };
  }
}


export async function getBusinessDetails(params) {
  const query = new URLSearchParams({
    start: params.start || 0,
    limit: params.limit || 5,
    envelopestatus: params.envelopestatus || 1,
  }).toString();

  try {
    const res = await fetch(`${process.env.API_URL}/get-business-data?${query}`, {
      method: "GET",
      next: { revalidate: 0 }, // Revalidate every 0 seconds
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return { status: false, msg: "Something went wrong!" };
  }
}

export async function getCustomerQuestion(params) {
    const body = { ...params};
    // console.log(body,"get-customer-question")
    try {
      const res = await fetch(process.env.API_URL + "/get-customer-question", {
        method: "post",
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return { status: false, msg: "Something went wrong!" };
    }
  }



  export async function addCustomerQuestion(params) {
    const body = params;
    // console.log(body);
    try {
      const res = await fetch(process.env.API_URL + "/add-customer-question", {
        method: "post",
        body:  JSON.stringify(body),
        cache: "no-store",
      });
      const response = await res.json();
      console.log(response);
      return response;
    } catch (error) {
      console.error("Error fetching data:", error);
      return;
    }
  }