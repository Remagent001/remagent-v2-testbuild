import Layout from '@/components/Main/Layout/Layout'
import React from 'react'

export default function layout({ children }) {
    return (
        <>
            <Layout>
                {children}
            </Layout>
        </>
    )
}
